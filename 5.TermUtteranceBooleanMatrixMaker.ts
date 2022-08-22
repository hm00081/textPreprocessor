/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Read term_list
import fs from "fs";
import _ from "lodash";
import * as math from "mathjs";

import { UtteranceObject } from "../interfaces/interfaces";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
const debateName = "모병제clipped";

// paths
const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfSingleTermList = `../data/${debateName}/single_term/term_list.json`;
const pathOfSingleTermUtteranceBooleanMatrix = `../data/${debateName}/single_term/term_utterance_boolean_matrix.json`;
const pathOfCompoundTermList = `../data/${debateName}/compound_term/term_list.json`;
const pathOfCompoundTermUtteranceBooleanMatrix = `../data/${debateName}/compound_term/term_utterance_boolean_matrix.json`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);
const singleTermList: string[] = require(pathOfSingleTermList);
const compoundTermList: string[] = require(pathOfCompoundTermList);

class TermUtteranceBooleanMatrixMaker {
  private readonly _termUtteranceBooleanMatrix: number[][];

  constructor(utteranceObjects: UtteranceObject[], termList: string[]) {
    this._termUtteranceBooleanMatrix = math.zeros([
      termList.length,
      utteranceObjects.length,
    ]) as number[][];

    _.forEach(termList, (term, termIndex) => {
      _.forEach(utteranceObjects, (utteranceObject, utteranceIndex) => {
        if (utteranceObject.utterance.search(term) !== -1) {
          this._termUtteranceBooleanMatrix[termIndex][utteranceIndex] = 1;
        }
      });
    });
  }

  public get termUtteranceBooleanMatrix() {
    return this._termUtteranceBooleanMatrix;
  }
}

if (require.main === module) {
  const singleTermUtteranceBooleanMatrixMaker = new TermUtteranceBooleanMatrixMaker(
    utteranceObjects,
    singleTermList
  );
  const compoundTermUtteranceBooleanMatrixMaker = new TermUtteranceBooleanMatrixMaker(
    utteranceObjects,
    compoundTermList
  );

  // Write TermUtteranceBooleanMatrix
  fs.writeFileSync(
    pathOfSingleTermUtteranceBooleanMatrix,
    JSON.stringify(
      singleTermUtteranceBooleanMatrixMaker.termUtteranceBooleanMatrix
    )
  );
  console.log(`'${pathOfSingleTermUtteranceBooleanMatrix}' is made.`);
  fs.writeFileSync(
    pathOfCompoundTermUtteranceBooleanMatrix,
    JSON.stringify(
      compoundTermUtteranceBooleanMatrixMaker.termUtteranceBooleanMatrix
    )
  );
  console.log(`'${pathOfCompoundTermUtteranceBooleanMatrix}' is made.`);

  console.log("process end");
}
