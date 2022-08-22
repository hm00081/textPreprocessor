import _ from "lodash";
import * as math from "mathjs";
import {
  SentenceObject,
  TermCountDict,
  UtteranceObject,
} from "../../interfaces/interfaces";

export interface OccurrenceDict {
  [term: string]: number;
}
type TermCountDictType = "singleTermCountDict" | "compoundTermCountDict";

export class OccurrenceMaker {
  private _occurrenceVector: number[];
  private _cooccurrenceMatrix: number[][];

  constructor(
    utteranceOjbects: UtteranceObject[],
    termList: string[],
    termCountDictType: TermCountDictType,
    sentenceWindow: number
  ) {
    const termCountDictsOfWS: TermCountDict[] = [];

    const windowSentenceElements: SentenceObject[] = [];
    _.forEach(utteranceOjbects, (utteranceOjbect, utteranceIndex) => {
      _.forEach(
        utteranceOjbect.sentenceObjects,
        (sentenceObject, sentenceIndex) => {
          // make windowSentences
          if (windowSentenceElements.length === sentenceWindow) {
            const termCountDictOfWS = this.makeTermCountDictOfWS(
              windowSentenceElements,
              termCountDictType
            );
            termCountDictsOfWS.push(termCountDictOfWS);

            windowSentenceElements.shift();
            windowSentenceElements.push(sentenceObject);

            // When last part of loop, The code should work 1 more job.
            if (
              utteranceIndex === utteranceOjbects.length - 1 &&
              sentenceIndex === utteranceOjbect.sentenceObjects.length - 1
            ) {
              const termCountDictOfWS = this.makeTermCountDictOfWS(
                windowSentenceElements,
                termCountDictType
              );
              termCountDictsOfWS.push(termCountDictOfWS);
            }
          } else if (windowSentenceElements.length < sentenceWindow) {
            windowSentenceElements.push(sentenceObject);
          }

          // make occurrenceDict
          // _.forEach(termList, (term) => {
          //   if (sentenceObject.sentence.search(term) !== -1) {
          //     if (term in occurrenceDict) occurrenceDict[term] += 1;
          //     else occurrenceDict[term] = 1;
          //   }
          // });
        }
      );
    });

    // console.log("termCountDictsOfWS", termCountDictsOfWS);

    // make occurrenceVector
    const occurrenceDict: OccurrenceDict = {};
    _.forEach(termList, (term) => {
      _.forEach(termCountDictsOfWS, (termCountDictOfWS) => {
        if (term in termCountDictOfWS) {
          if (term in occurrenceDict) occurrenceDict[term] += 1;
          else occurrenceDict[term] = 1;
        }
      });
    });
    this._occurrenceVector = _.map(termList, (term) => {
      return occurrenceDict[term];
    });

    // make cooccurrenceMatrix
    this._cooccurrenceMatrix = math.zeros([
      termList.length,
      termList.length,
    ]) as number[][];
    _.forEach(termList, (term1, term1Index) => {
      _.forEach(termList, (term2, term2Index) => {
        _.forEach(termCountDictsOfWS, (termCountDictOfWS) => {
          if (term1 in termCountDictOfWS && term2 in termCountDictOfWS) {
            this._cooccurrenceMatrix[term1Index][term2Index] += 1;
          }
        });
      });
    });
  }

  private makeTermCountDictOfWS(
    windowSentenceElements: SentenceObject[],
    termCountDictType: TermCountDictType
  ): TermCountDict {
    const termCountDictOfWS: TermCountDict = {};
    _.forEach(windowSentenceElements, (windowSentenceElement) => {
      _.forEach(windowSentenceElement[termCountDictType], (count, term) => {
        if (term in termCountDictOfWS) {
          termCountDictOfWS[term] += count;
        } else {
          termCountDictOfWS[term] = count;
        }
      });
    });
    return termCountDictOfWS;
  }

  public get occurrenceVector(): number[] {
    return this._occurrenceVector;
  }
  public get cooccurrenceMatrix(): number[][] {
    return this._cooccurrenceMatrix;
  }
}
