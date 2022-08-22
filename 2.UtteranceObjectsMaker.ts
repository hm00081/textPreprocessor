import fs from "fs";
import _ from "lodash";
import { UtteranceObject } from "../interfaces/interfaces";

// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
// const debateName = "모병제clipped";
const debateName = "지방소멸";
// const debateName = "집값";
// const debateName = "정년연장";

// path of sample
const pathOfCleanedTranscript = `../data/${debateName}/cleaned_transcript.txt`;
const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfOnlyUtterancesText = `../data/${debateName}/only_utterances_text.txt`;

const cleanedTranscript: string = fs.readFileSync(
  pathOfCleanedTranscript,
  "utf-8"
);

class UtteranceObjectsMaker {
  private _utteranceObjects: UtteranceObject[] = [];
  private _onlyUtterancesText = "";

  constructor(cleanedTranscript: string) {
    // Split based on '\n'
    // Join all of splited text.
    // Split joined text based on "◎". These splited texts are paragraph candidates
    //
    // For each paragraph candidate, split it based on ">"
    // Left splited one is name. Right splited one is paragraph.
    //
    //
    // Split based on '\n'
    const splitedOriginalText = cleanedTranscript.split("\n");

    // Join all of splited text.
    const allInOneText = splitedOriginalText.join("");

    // Split joined text based on "◎". These splited texts are paragraph candidates
    const utteranceCandidates = allInOneText.split("◎");
    // console.log("paragraphCandidates", paragraphCandidates);

    // For each paragraph candidate, split it based on ">"
    _.forEach(utteranceCandidates, (utteranceCandidate) => {
      const splitedUtteranceCandidate = utteranceCandidate.split(">");

      // Left splited one is name. Right splited one is paragraph.
      if (
        splitedUtteranceCandidate[0] !== undefined &&
        splitedUtteranceCandidate[1] !== undefined
      ) {
        const name = splitedUtteranceCandidate[0].trim();

        // find utterance part
        let utterance = "";
        if (splitedUtteranceCandidate.length <= 2) {
          utterance = splitedUtteranceCandidate[1].trim();
        } else {
          const tempArray: string[] = [];
          for (let i = 1; i < splitedUtteranceCandidate.length; i++) {
            tempArray.push(splitedUtteranceCandidate[i]);
          }
          utterance = tempArray.join(">").trim();
        }

        if (!utterance[utterance.length - 1].match(/\.|\?/)) {
          utterance += ".";
        }

        this._utteranceObjects.push({
          name,
          utterance,
          sentenceObjects: [],
        });

        this._onlyUtterancesText += " " + utterance;
      }
    });

    this._onlyUtterancesText = this._onlyUtterancesText.trim();
  }

  public get utteranceObjects() {
    return this._utteranceObjects;
  }
  public get onlyUtterancesText() {
    return this._onlyUtterancesText;
  }
}

if (require.main === module) {
  const utteranceObjectsMaker = new UtteranceObjectsMaker(cleanedTranscript);

  fs.writeFileSync(
    pathOfUtteranceObjects,
    JSON.stringify(utteranceObjectsMaker.utteranceObjects)
  );
  console.log(`'${pathOfUtteranceObjects}' is made.`);

  // fs.writeFileSync(
  //   pathOfOnlyUtterancesText,
  //   utteranceObjectsMaker.onlyUtterancesText
  // );
  // console.log(`'${pathOfOnlyUtterancesText}' is made.`);

  console.log("process end");
}
