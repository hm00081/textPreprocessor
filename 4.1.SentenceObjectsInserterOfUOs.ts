/* eslint-disable @typescript-eslint/no-var-requires */
import fs from "fs";
import _ from "lodash";
import {
  StopwordDict,
  TermCountDict,
  UtteranceObject,
} from "../interfaces/interfaces";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
// const debateName = "모병제clipped";
const debateName = "지방소멸";
// const debateName = "집값";
// const debateName = "정년연장";

const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);
const sentenceObjectsOfAiopen: SentenceObjectOfAiopen[] = require(`../data/${debateName}/sentence_objects_of_aiopen.json`);
const stopwordDict: StopwordDict = require(`../data/${debateName}/stopword_dict.json`);

export interface Morp {
  id: number; // 0
  lemma: string; // "양쪽"
  position: number; // 143
  type: string; // "NNG"
  weight: number; // 0.0507141
}

export interface Word {
  begin: number; // 0
  end: number; // 1
  id: number; // 0
  text: string; // "양쪽이"
  type: string; // ""
}

export interface SentenceObjectOfAiopen {
  text: string;
  morp: Morp[];
  word: Word[];
  [something: string]: unknown;
}

/**
 * Make sentenceObjects to insert utteranceObject
 */
class SentenceObjectsInserterOfUOs {
  constructor(
    private _utteranceObjects: UtteranceObject[],
    sentenceObjectsOfAiopen: SentenceObjectOfAiopen[],
    stopwordDict: StopwordDict
  ) {
    // initiate sentenceObjects
    _.forEach(_utteranceObjects, (utteranceObject) => {
      utteranceObject.sentenceObjects = [];
    });

    let explorationIndex = 0;
    _.forEach(_utteranceObjects, (utteranceObject) => {
      for (let i = explorationIndex; i < sentenceObjectsOfAiopen.length; i++) {
        const sentenceObjectOfAiopen = sentenceObjectsOfAiopen[i];
        if (
          utteranceObject.utterance.indexOf(
            sentenceObjectsOfAiopen[i].text.trim()
          ) !== -1
        ) {
          utteranceObject.sentenceObjects.push({
            sentence: sentenceObjectOfAiopen.text.trim(),
            singleTermCountDict: this.makeSingleTermCountDict(
              sentenceObjectOfAiopen.morp,
              stopwordDict
            ),
            compoundTermCountDict: this.makeCompoundTermCountDict(
              sentenceObjectOfAiopen.word,
              sentenceObjectOfAiopen.morp,
              stopwordDict
            ),
            sentiment: 0,
            time: "",
          });
        } else {
          explorationIndex = i;
          break;
        }
      }
    });
  }

  public get utteranceObjects() {
    return this._utteranceObjects;
  }

  private makeSingleTermCountDict(
    morps: Morp[],
    stopwordDict: StopwordDict
  ): TermCountDict {
    const singleTermCountDict: TermCountDict = {};

    _.forEach(morps, (morp) => {
      if (
        this.checkNounCondition(morp.type) &&
        this.checkTermCondition(morp.lemma, stopwordDict)
      ) {
        if (morp.lemma in singleTermCountDict) {
          singleTermCountDict[morp.lemma] += 1;
        } else {
          singleTermCountDict[morp.lemma] = 1;
        }
      }
    });

    return singleTermCountDict;
  }
  private makeCompoundTermCountDict(
    words: Word[],
    morps: Morp[],
    stopwordDict: StopwordDict
  ): TermCountDict {
    const compoundTermCountDict: TermCountDict = {};

    _.forEach(words, (word) => {
      let compoundTerm = "";

      for (let i = word.begin; i <= word.end; i++) {
        const morp = morps[i];

        if (this.checkNounCondition(morp.type)) {
          compoundTerm += morp.lemma;
        }

        if (!this.checkNounCondition(morp.type) || i == word.end) {
          if (this.checkTermCondition(compoundTerm, stopwordDict)) {
            if (compoundTerm in compoundTermCountDict) {
              compoundTermCountDict[compoundTerm] += 1;
            } else {
              compoundTermCountDict[compoundTerm] = 1;
            }
          }
          compoundTerm = "";
        }
      }
    });

    return compoundTermCountDict;
  }

  private checkNounCondition(termType: string): boolean {
    return termType === "NNG" || termType === "NNP";
  }

  private checkTermCondition(
    term: string,
    stopwordDict: StopwordDict
  ): boolean {
    return term.length > 1 && !(term in stopwordDict);
  }
}

if (require.main === module) {
  const sentenceObjectsInserterOfUOs = new SentenceObjectsInserterOfUOs(
    utteranceObjects,
    sentenceObjectsOfAiopen,
    stopwordDict
  );

  fs.writeFileSync(
    pathOfUtteranceObjects,
    JSON.stringify(sentenceObjectsInserterOfUOs.utteranceObjects)
  );
  console.log(`${pathOfUtteranceObjects} is made.`);

  console.log("process end");
}
