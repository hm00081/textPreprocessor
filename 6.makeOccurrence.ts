/* eslint-disable @typescript-eslint/no-var-requires */

import fs from "fs";
import { UtteranceObject } from "../interfaces/interfaces";
import { OccurrenceMaker } from "./classes/OccurrenceMaker";

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
const pathOfutteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfSingleTermList = `../data/${debateName}/single_term/term_list.json`;
const pathOfCompoundTermList = `../data/${debateName}/compound_term/term_list.json`;
const pathOfSingleOccurrenceVector = `../data/${debateName}/single_term/occurrence_vector.json`;
const pathOfCompoundOccurrenceVector = `../data/${debateName}/compound_term/occurrence_vector.json`;
const pathOfSingleCooccurrenceMatrix = `../data/${debateName}/single_term/cooccurrence_matrix.json`;
const pathOfCompoundCooccurrenceMatrix = `../data/${debateName}/compound_term/cooccurrence_matrix.json`;

const utteranceObjects: UtteranceObject[] = require(pathOfutteranceObjects);
const singleTermList: string[] = require(pathOfSingleTermList);
const compoundTermList: string[] = require(pathOfCompoundTermList);

const sentenceWindow = 3;

if (require.main === module) {
  const singleOccurrenceMaker = new OccurrenceMaker(
    utteranceObjects,
    singleTermList,
    "singleTermCountDict",
    sentenceWindow
  );
  const compoundOccurrenceMaker = new OccurrenceMaker(
    utteranceObjects,
    compoundTermList,
    "compoundTermCountDict",
    sentenceWindow
  );

  fs.writeFileSync(
    pathOfSingleOccurrenceVector,
    JSON.stringify(singleOccurrenceMaker.occurrenceVector)
  );
  console.log(`'${pathOfSingleOccurrenceVector}' is made.`);

  fs.writeFileSync(
    pathOfSingleCooccurrenceMatrix,
    JSON.stringify(singleOccurrenceMaker.cooccurrenceMatrix)
  );
  console.log(`'${pathOfSingleCooccurrenceMatrix}' is made.`);

  fs.writeFileSync(
    pathOfCompoundOccurrenceVector,
    JSON.stringify(compoundOccurrenceMaker.occurrenceVector)
  );
  console.log(`'${pathOfCompoundOccurrenceVector}' is made.`);

  fs.writeFileSync(
    pathOfCompoundCooccurrenceMatrix,
    JSON.stringify(compoundOccurrenceMaker.cooccurrenceMatrix)
  );
  console.log(`'${pathOfCompoundCooccurrenceMatrix}' is made.`);

  console.log("process end");
}
