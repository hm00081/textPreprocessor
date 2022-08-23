/* eslint-disable @typescript-eslint/no-var-requires */
import fs from "fs";
import _ from "lodash";
import * as math from "mathjs";
const makeCosineSimilarity = require("compute-cosine-similarity");

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
const pathOfSingleSimilarityMatrix = `../data/${debateName}/single_term/similarity_matrix.json`;
const pathOfSingleTermUtteranceBooleanMatrix = `../data/${debateName}/single_term/term_utterance_boolean_matrix.json`;
const pathOfSingleConceptMatrixPath = `../data/${debateName}/single_term/concept_matrix.json`;
const pathOfCompoundSimilarityMatrix = `../data/${debateName}/compound_term/similarity_matrix.json`;
const pathOfCompoundTermUtteranceBooleanMatrix = `../data/${debateName}/compound_term/term_utterance_boolean_matrix.json`;
const pathOfCompoundConceptMatrixPath = `../data/${debateName}/compound_term/concept_matrix.json`;

const singleSimilarityMatrix: number[][] = require(pathOfSingleSimilarityMatrix);
const singleTermUtteranceBooleanMatrix: number[][] = require(pathOfSingleTermUtteranceBooleanMatrix);
const compoundSimilarityMatrix: number[][] = require(pathOfCompoundSimilarityMatrix);
const compoundTermUtteranceBooleanMatrix: number[][] = require(pathOfCompoundTermUtteranceBooleanMatrix);

class ConceptMatrixMaker {
  private _conceptMatrix: number[][];
  constructor(
    similarityMatrix: number[][],
    termUtteranceBooleanMatrix: number[][]
  ) {
    this._conceptMatrix = math.multiply(
      similarityMatrix,
      termUtteranceBooleanMatrix
    );
  }

  public get conceptMatrix() {
    return this._conceptMatrix;
  }
}

if (require.main === module) {
  const singleConceptMatrixMaker = new ConceptMatrixMaker(
    singleSimilarityMatrix,
    singleTermUtteranceBooleanMatrix
  );
  const compoundConceptMatrixMaker = new ConceptMatrixMaker(
    compoundSimilarityMatrix,
    compoundTermUtteranceBooleanMatrix
  );

  fs.writeFileSync(
    pathOfSingleConceptMatrixPath,
    JSON.stringify(singleConceptMatrixMaker.conceptMatrix)
  );
  console.log(`${pathOfSingleConceptMatrixPath} is made.`);

  fs.writeFileSync(
    pathOfCompoundConceptMatrixPath,
    JSON.stringify(compoundConceptMatrixMaker.conceptMatrix)
  );
  console.log(`${pathOfCompoundConceptMatrixPath} is made.`);

  console.log("process end");
}
