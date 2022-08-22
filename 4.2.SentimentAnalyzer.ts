/* eslint-disable @typescript-eslint/no-var-requires */
import fs from "fs";
import _ from "lodash";
const language = require("@google-cloud/language");
import { UtteranceObject } from "../interfaces/interfaces";
const client = new language.LanguageServiceClient();

// TODO Before execute code, type command in terminal
// export GOOGLE_APPLICATION_CREDENTIALS="/OO.../**.json" // mac
// $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\username\Downloads\my-key.json" // windows

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
const debateName = "모병제clipped";

const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfSentimentResult = `../data/${debateName}/sentiment_result_of_googlenl.json`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);

class SentimentAnalyzer {
  public async initiate(
    utteranceObjects: UtteranceObject[],
    languageServiceClient: any
  ) {
    // make one utterances_text
    let utterancesText = "";
    _.forEach(utteranceObjects, (utteranceObject) => {
      utterancesText += " " + utteranceObject.utterance;
    });
    utterancesText = utterancesText.trim();

    // Request API
    const [result] = await languageServiceClient.analyzeSentiment({
      document: {
        content: utterancesText,
        type: "PLAIN_TEXT",
        language: "ko",
      },
    });

    return result;
  }
}

if (require.main === module) {
  const sentimentAnalyzer = new SentimentAnalyzer();
  sentimentAnalyzer.initiate(utteranceObjects, client).then((result) => {
    // write utteranceObjects.json
    fs.writeFileSync(pathOfSentimentResult, JSON.stringify(result));
    console.log(`${pathOfSentimentResult} is made.`);

    console.log("process end");
  });
}
