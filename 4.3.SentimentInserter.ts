/* eslint-disable @typescript-eslint/no-var-requires */
import fs from "fs";
import _ from "lodash";
import { SentenceObject, UtteranceObject } from "../interfaces/interfaces";

interface SentimentResult {
  sentences: SentenceSentiment[];
  documentSentiment: { magnitude: number; score: number };
  language: string;
}

interface SentenceSentiment {
  text: {
    content: string;
    beginOffset: number;
  };
  sentiment: {
    magnitude: number;
    score: number;
  };
}

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
// const debateName = "모병제clipped";
const debateName = "지방소멸";

const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfSentimentResult = `../data/${debateName}/sentiment_result_of_googlenl.json`;
const pathOfTestUtteranceObjects = `../data/${debateName}/test_utterance_objects.json`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);
const sentimentResult: SentimentResult = require(pathOfSentimentResult);

class SentimentInserter {
  private _utteranceObjects: UtteranceObject[];

  constructor(
    utteranceObjects: UtteranceObject[],
    sentenceSentiments: SentenceSentiment[]
  ) {
    // make sentenceObjects
    const sentenceObjects: SentenceObject[] = [];
    _.forEach(utteranceObjects, (utteranceObject) => {
      _.forEach(utteranceObject.sentenceObjects, (sentenceObject) => {
        sentenceObjects.push(sentenceObject);
      });
    });

    // Match between utteranceObjects and sentenceSentiments
    let i = 0; // index of sentenceObjects
    let j = 0; // index of sentenceSentiments
    let lastChanged: "i" | "j" = "j";
    while (i < sentenceObjects.length || j < sentenceSentiments.length) {
      if (
        sentenceSentiments[j].text.content.includes(sentenceObjects[i].sentence)
      ) {
        sentenceObjects[i].sentiment += sentenceSentiments[j].sentiment.score;
        if (
          sentenceObjects[i].sentence.includes(
            sentenceSentiments[j].text.content
          )
        ) {
          i++;
          j++;
          lastChanged = "j";
        } else {
          j++;
          lastChanged = "j";
        }
      } else {
        if (
          sentenceObjects[i].sentence.includes(
            sentenceSentiments[j].text.content
          )
        ) {
          sentenceObjects[i].sentiment += sentenceSentiments[j].sentiment.score;
          i++;
          lastChanged = "i";
        } else {
          if (lastChanged === "j") {
            i++;
          } else {
            j++;
            lastChanged = "j";
          }
        }
      }
    }

    this._utteranceObjects = utteranceObjects;
  }

  public get utteranceObjects() {
    return this._utteranceObjects;
  }
}

// write utteranceOjbects.json
if (require.main === module) {
  const sentimentInserter = new SentimentInserter(
    utteranceObjects,
    sentimentResult.sentences
  );

  // write utteranceObjects.json
  fs.writeFileSync(
    pathOfUtteranceObjects,
    JSON.stringify(sentimentInserter.utteranceObjects)
  );
  console.log(`${pathOfUtteranceObjects} is made.`);

  console.log("process end");
}
