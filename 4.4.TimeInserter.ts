/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Insert time to each sentenceObject
 */
import fs from "fs";
import _ from "lodash";
import { UtteranceObject } from "../interfaces/interfaces";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "기본소득clipped";
// const debateName = "정시확대";
// const debateName = "정시확대clipped";
// const debateName = "모병제";
const debateName = "모병제clipped";
// const debateName = "집값";
// const debateName = "정년연장";

// TODO Not only OS... But we can choose "linux&mac" or "windows"
const operatingSystemType: OperatingSystemType = "windows";

interface VrewSpoken {
  spoken: string;
  time: string;
}
type OperatingSystemType = "linux&mac" | "windows";

const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfVrewTranscript = `../data/${debateName}/vrew_transcript.txt`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);
const vrewTranscript: string = fs.readFileSync(pathOfVrewTranscript, "utf-8");

class TimeInserter {
  public constructor(
    private _utteranceObjects: UtteranceObject[],
    vrewTranscript: string,
    operatingSystemType: OperatingSystemType
  ) {
    // clear time in utteranceObjects
    _.forEach(_utteranceObjects, (utteranceObject) => {
      _.forEach(utteranceObject.sentenceObjects, (sentenceObject) => {
        sentenceObject.time = "";
      });
    });

    // make vrewSpokens
    const lineSeperator = operatingSystemType === "linux&mac" ? "\n" : "\r\n";
    const transcriptLines = vrewTranscript.split(lineSeperator);
    const vrewSpokens: VrewSpoken[] = _.map(transcriptLines, (line) => {
      const lineSplitted = line.split("\t");

      let vrewSpoken: VrewSpoken;
      if (lineSplitted.length === 2) {
        vrewSpoken = {
          spoken: lineSplitted[1],
          time: lineSplitted[0],
        };
      } else if (lineSplitted.length === 1) {
        vrewSpoken = {
          spoken: lineSplitted[0],
          time: "",
        };
      } else {
        throw new Error("make vrewSpokens error");
      }

      return vrewSpoken;
    });
    console.log("vrewSpokens.length", vrewSpokens.length);

    _.forEach(vrewSpokens, (vrewSpoken, vrewSpokenIndex) => {
      if (vrewSpoken.time === "") {
        const pastVrewSpokenHavingTime = this.findPastVrewSpokenHavingTime(
          vrewSpokenIndex,
          vrewSpokens
        );
        vrewSpoken.time = pastVrewSpokenHavingTime.time;
      }
    });

    let currentVrewSpokenIndex = 0;

    _.forEach(_utteranceObjects, (utteranceObject) => {
      _.forEach(utteranceObject.sentenceObjects, (sentenceObject) => {
        // console.log("currentVrewSpokenIndex", currentVrewSpokenIndex);

        currentVrewSpokenIndex = this.findVrewSpokenIndexBySentence(
          sentenceObject.sentence,
          currentVrewSpokenIndex,
          vrewSpokens
        );

        sentenceObject.time = vrewSpokens[currentVrewSpokenIndex].time;
      });
    });
  }

  private findPastVrewSpokenHavingTime(
    currentVrewSpokenIndex: number,
    vrewSpokens: VrewSpoken[]
  ): VrewSpoken {
    let pastVrewSpokenHavingTime: VrewSpoken | null = null;

    for (let i = currentVrewSpokenIndex - 1; i >= 0; i--) {
      if (vrewSpokens[i].time !== "") {
        pastVrewSpokenHavingTime = vrewSpokens[i];
        break;
      }
    }

    if (pastVrewSpokenHavingTime) {
      return pastVrewSpokenHavingTime;
    } else {
      throw new Error("findPastVrewSpokenHavingTime error");
    }
  }

  private findVrewSpokenIndexBySentence(
    sentence: string,
    currentVrewSpokenIndex: number,
    vrewSpokens: VrewSpoken[]
  ): number {
    let newIndex = 0;

    for (let i = currentVrewSpokenIndex; i < vrewSpokens.length; i++) {
      // console.log("i", i, "vrewSpokens[i]", vrewSpokens[i]);
      if (vrewSpokens[i].spoken.includes(sentence)) {
        newIndex = i;
        break;
      }
    }

    return newIndex;
  }

  public get utteranceObjects() {
    return this._utteranceObjects;
  }
}

// write utteranceObjects
if (require.main === module) {
  const timeInserter = new TimeInserter(
    utteranceObjects,
    vrewTranscript,
    operatingSystemType
  );

  // console.log("timeInserter.utteranceObjects", timeInserter.utteranceObjects);
  fs.writeFileSync(
    pathOfUtteranceObjects,
    JSON.stringify(timeInserter.utteranceObjects)
  );

  console.log(`${pathOfUtteranceObjects} is made.`);
  console.log("process end");
}
