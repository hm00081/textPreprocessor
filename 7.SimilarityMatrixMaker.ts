/* eslint-disable @typescript-eslint/no-var-requires */
import { KeytermObject, UtteranceObject } from "./../interfaces/interfaces";
import _ from "lodash";
import * as math from "mathjs";
import fs from "fs";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
// const debateName = "모병제clipped";
const debateName = "지방소멸";

// paths
const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfSingleTermList = `../data/${debateName}/single_term/term_list.json`;
const pathOfSingleCooccurrenceMatrix = `../data/${debateName}/single_term/cooccurrence_matrix.json`;
const pathOfSingleKeytermObjects = `../data/${debateName}/single_term/keyterm_objects.json`;
const pathOfSingleOccurrenceVector = `../data/${debateName}/single_term/occurrence_vector.json`;
const pathOfSingleSimilarityMatrix = `../data/${debateName}/single_term/similarity_matrix.json`;
const pathOfCompoundTermList = `../data/${debateName}/compound_term/term_list.json`;
const pathOfCompoundCooccurrenceMatrix = `../data/${debateName}/compound_term/cooccurrence_matrix.json`;
const pathOfCompoundKeytermObjects = `../data/${debateName}/compound_term/keyterm_objects.json`;
const pathOfCompoundOccurrenceVector = `../data/${debateName}/compound_term/occurrence_vector.json`;
const pathOfCompoundSimilarityMatrix = `../data/${debateName}/compound_term/similarity_matrix.json`;

const singleTermList: string[] = require(pathOfSingleTermList);
const singleKeytermObjects: KeytermObject[] = require(pathOfSingleKeytermObjects);
const singleOccurrenceVector: number[] = require(pathOfSingleOccurrenceVector);
const singleCooccurrenceMatrix: number[][] = require(pathOfSingleCooccurrenceMatrix);
const compoundTermList: string[] = require(pathOfCompoundTermList);
const compoundKeytermObjects: KeytermObject[] = require(pathOfCompoundKeytermObjects);
const compoundOccurrenceVector: number[] = require(pathOfCompoundOccurrenceVector);
const compoundCooccurrenceMatrix: number[][] = require(pathOfCompoundCooccurrenceMatrix);
const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);

class SimilarityMatrixMaker {
  private _similarityMatrix: number[][];

  constructor(
    keytermObjects: KeytermObject[],
    termList: string[],
    occurrenceVector: number[],
    cooccurrenceMatrix: number[][],
    utteranceObjects: UtteranceObject[]
  ) {
    const lengthOfWindowSentences = this.getLengthOfWindowSentences(
      utteranceObjects
    );
    // console.log("lengthOfWindowSentences", lengthOfWindowSentences);
    // make matrix which is size of (keyterm x term)
    const similarityMatrix = math.zeros([
      keytermObjects.length,
      termList.length,
    ]) as number[][];

    _.forEach(keytermObjects, (keytermObject, keytermIndex) => {
      _.forEach(termList, (term, termIndex) => {
        similarityMatrix[keytermIndex][termIndex] = this.makeSimilarityScore(
          keytermObject.index,
          termIndex,
          occurrenceVector,
          cooccurrenceMatrix,
          lengthOfWindowSentences
        );
      });
    });

    // const maxes = _.map(similarityMatrix, (termSimilarities) => {
    //   return _.max(termSimilarities);
    // });
    // console.log("maxes", maxes);
    // console.log("maxOfMax", _.max(maxes));

    this._similarityMatrix = similarityMatrix;
  }

  private getLengthOfWindowSentences(
    utteranceObjects: UtteranceObject[]
  ): number {
    return (
      _.reduce(
        utteranceObjects,
        (sum, utteranceObject) => {
          return sum + utteranceObject.sentenceObjects.length;
        },
        0
      ) - 2
    );
  }

  public get similarityMatrix() {
    return this._similarityMatrix;
  }

  private makeSimilarityScore(
    termIIndex: number,
    termJIndex: number,
    occurrenceVector: number[],
    cooccurrenceMatrix: number[][],
    lengthOfWindowSentences: number
  ): number {
    const makePTiTjCurried = _.curry(this.makePTiTj)(
      cooccurrenceMatrix,
      lengthOfWindowSentences
    );
    const makePTbariTbarjCurried = _.curry(this.makePTbariTbarj)(
      occurrenceVector,
      cooccurrenceMatrix,
      lengthOfWindowSentences
    );
    const makePTbariTjCurried = _.curry(this.makePTbariTj)(
      occurrenceVector,
      cooccurrenceMatrix
    );
    const makePTiTbarjCurried = _.curry(this.makePTiTbarj)(
      occurrenceVector,
      cooccurrenceMatrix
    );

    const pTiTj = makePTiTjCurried(termIIndex, termJIndex);
    const pTbariTbarj = makePTbariTbarjCurried(termIIndex, termJIndex);
    const pTbariTj = makePTbariTjCurried(termIIndex, termJIndex);
    const pTiTbarj = makePTiTbarjCurried(termIIndex, termJIndex);

    const similarityScore: number =
      (pTiTj * pTbariTbarj) / (pTbariTj * pTiTbarj);
    // (pTiTj * pTbariTbarj) / (pTbariTj + pTiTbarj);

    // TODO
    return similarityScore;
    // return Number(similarityScore.toFixed(2));
  }

  private makePTiTj(
    cooccurrenceMatrix: number[][],
    lengthOfWindowSentences: number,
    termIIndex: number,
    termJIndex: number
  ): number {
    return cooccurrenceMatrix[termIIndex][termJIndex] / lengthOfWindowSentences;
  }

  // ratio between cooccurrence and occurrence
  private makePTbariTbarj(
    occurrenceVector: number[],
    cooccurrenceMatrix: number[][],
    lengthOfWindowSentences: number,
    termIIndex: number,
    termJIndex: number
  ): number {
    let result = 0;
    if (
      occurrenceVector[termIIndex] + occurrenceVector[termJIndex] >=
      cooccurrenceMatrix[termIIndex][termJIndex] + lengthOfWindowSentences
    ) {
      // TODO
      // result = 1 / lengthOfWindowSentences;
      result = 0.5 / lengthOfWindowSentences;
    } else {
      result =
        (lengthOfWindowSentences -
          occurrenceVector[termIIndex] -
          occurrenceVector[termJIndex] +
          cooccurrenceMatrix[termIIndex][termJIndex]) /
        lengthOfWindowSentences;
    }

    return result;
  }

  // ratio between cooccurrence and occurrence
  private makePTiTbarj(
    occurrenceVector: number[],
    cooccurrenceMatrix: number[][],
    termIIndex: number,
    termJIndex: number
  ): number {
    let result = 0;
    if (
      occurrenceVector[termIIndex] ===
      cooccurrenceMatrix[termIIndex][termJIndex]
    ) {
      // TODO
      // result = 1;
      result = 0.5;
    } else {
      result =
        occurrenceVector[termIIndex] -
        cooccurrenceMatrix[termIIndex][termJIndex];
    }
    return result;
  }

  // ratio between cooccurrence and occurrence
  private makePTbariTj(
    occurrenceVector: number[],
    cooccurrenceMatrix: number[][],
    termIIndex: number,
    termJIndex: number
  ): number {
    let result = 0;
    if (
      occurrenceVector[termJIndex] ===
      cooccurrenceMatrix[termIIndex][termJIndex]
    ) {
      // TODO
      // result = 1;
      result = 0.5;
    } else {
      result =
        occurrenceVector[termJIndex] -
        cooccurrenceMatrix[termIIndex][termJIndex];
    }
    return result;
  }
}

if (require.main === module) {
  const singleSimilarityMatrixMaker = new SimilarityMatrixMaker(
    singleKeytermObjects,
    singleTermList,
    singleOccurrenceVector,
    singleCooccurrenceMatrix,
    utteranceObjects
  );
  const compoundSimilarityMatrixMaker = new SimilarityMatrixMaker(
    compoundKeytermObjects,
    compoundTermList,
    compoundOccurrenceVector,
    compoundCooccurrenceMatrix,
    utteranceObjects
  );

  fs.writeFileSync(
    pathOfSingleSimilarityMatrix,
    JSON.stringify(singleSimilarityMatrixMaker.similarityMatrix)
  );
  console.log(`${pathOfSingleSimilarityMatrix} is made.`);

  fs.writeFileSync(
    pathOfCompoundSimilarityMatrix,
    JSON.stringify(compoundSimilarityMatrixMaker.similarityMatrix)
  );
  console.log(`${pathOfCompoundSimilarityMatrix} is made.`);
}
