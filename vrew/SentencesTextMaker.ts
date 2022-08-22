import fs from "fs";
/* eslint-disable @typescript-eslint/no-var-requires */
import _ from "lodash";
import { UtteranceObject } from "../../interfaces/interfaces";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
const debateName = "지방소멸";
// const debateName = "모병제";
// const debateName = "집값";
// const debateName = "정년연장";

const pathOfUtteranceObjects = `../../data/${debateName}/utterance_objects.json`;
const pathOfSentencesText = `../../data/${debateName}/sentences_text.txt`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);

fs.writeFileSync(pathOfSentencesText, "");

const writeStream = fs.createWriteStream(pathOfSentencesText, { flags: "a" });
_.forEach(utteranceObjects, (utteranceObject) => {
  _.forEach(utteranceObject.sentenceObjects, (sentenceObject) => {
    writeStream.write(`${sentenceObject.sentence}\n`);
  });
});

writeStream.end();

console.log(`${pathOfSentencesText} is made.`);
console.log("process end");
