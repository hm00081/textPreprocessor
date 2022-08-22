import { SentenceObject } from "../interfaces/interfaces";
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Insert time to each sentenceObject
 */

import { UtteranceObject } from "../interfaces/interfaces";
import fs from "fs";
import _ from "lodash";
import stringSimilarity from "string-similarity";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "정시확대";
// const debateName = "모병제";
// const debateName = "기본소득clipped";
const debateName = "집값";

interface VrewSpoken {
  spoken: string;
  time: string;
}

const pathOfUtteranceObjects = `../data/${debateName}/utterance_objects.json`;
const pathOfVrewTranscript = `../data/${debateName}/vrew_transcript.txt`;

const utteranceObjects: UtteranceObject[] = require(pathOfUtteranceObjects);
const vrewTranscript: string = fs.readFileSync(pathOfVrewTranscript, "utf-8");

class TimeInserter {
  public constructor(
    private _utteranceObjects: UtteranceObject[],
    vrewTranscript: string
  ) {
    // clear time in utteranceObjects
    _.forEach(_utteranceObjects, (utteranceObject) => {
      _.forEach(utteranceObject.sentenceObjects, (sentenceObject) => {
        sentenceObject.time = "";
      });
    });

    // make vrewSpokens
    const transcriptLines = vrewTranscript.split("\n");
    const vrewSpokens: VrewSpoken[] = _.map(transcriptLines, (line) => {
      const lineSplitted = line.split("\t");
      return {
        spoken: lineSplitted[1],
        time: lineSplitted[0],
      };
    });

    // we can know max of vrew time diff
    const maxOfVrewTimeDiff = this.getMaxOfVrewTimeDiff(vrewSpokens);
    console.log("maxOfVrewTimeDiff", maxOfVrewTimeDiff);

    // for each time, find best matching sentence
    for (let i = 1; i < vrewSpokens.length; i++) {
      const vrewSpoken = vrewSpokens[i];

      const similarityObject = this.getMaxSimilarityBetweenVrewSpokenAndUtterances(
        vrewSpoken,
        _utteranceObjects
      );

      const maxSentence =
        _utteranceObjects[similarityObject.utteranceIndex].sentenceObjects[
          similarityObject.sentenceIndex
        ];

      if (maxSentence.time === "") {
        maxSentence.time = vrewSpoken.time;
      }
    }

    // fix time error
    this.fixTimeError(_utteranceObjects);

    // fill empty time
    this.fillEmptyTime(_utteranceObjects);
  }

  private getMaxSimilarityBetweenVrewSpokenAndUtterances(
    vrewSpoken: VrewSpoken,
    utteranceObjects: UtteranceObject[]
  ) {
    const similarityObjects = _.map(utteranceObjects, (utteranceObject) =>
      this.getMaxSimilarityBetweenVrewspokenAndUtterance(
        vrewSpoken,
        utteranceObject
      )
    );

    const similarities = _.map(
      similarityObjects,
      (similarityObject) => similarityObject.maxSimilarity
    );

    const maxSimilarity = _.max(similarities);

    const maxUtteranceIndex = _.findIndex(
      similarities,
      (similarity) => similarity === maxSimilarity
    );

    return {
      similarity: maxSimilarity,
      utteranceIndex: maxUtteranceIndex,
      sentenceIndex:
        similarityObjects[maxUtteranceIndex].maxSimilaritySentenceIndex,
    };
  }

  private getMaxSimilarityBetweenVrewspokenAndUtterance(
    vrewSpoken: VrewSpoken,
    utteranceObject: UtteranceObject
  ) {
    const similarities = _.map(
      utteranceObject.sentenceObjects,
      (sentenceObject) =>
        stringSimilarity.compareTwoStrings(
          vrewSpoken.spoken,
          sentenceObject.sentence
        )
    );

    const maxSimilarity = _.max(similarities) as number;

    const maxSimilaritySentenceIndex = _.findIndex(
      similarities,
      (similarity) => similarity === maxSimilarity
    );

    return { maxSimilarity, maxSimilaritySentenceIndex };
  }

  private findPastTime(p: {
    currentSentence: SentenceObject;
    currentSentenceIndex: number;
    currentUtteranceIndex: number;
    utteranceObjects: UtteranceObject[];
  }) {
    let pastTimeSentenceObject: SentenceObject | null = null;
    let pastTimeSentenceIndex = p.currentSentenceIndex - 1;
    let pastTimeUtteranceIndex = p.currentUtteranceIndex;
    let characterInterval = 0;

    // sentences in the current utterance
    for (let j = p.currentSentenceIndex - 1; j >= 0; j--) {
      const testingSentenceObject =
        utteranceObjects[p.currentUtteranceIndex].sentenceObjects[j];

      characterInterval += testingSentenceObject.sentence.length;

      if (testingSentenceObject.time !== "") {
        // This is pastTime
        pastTimeSentenceObject = testingSentenceObject;
        pastTimeSentenceIndex = j;
        break;
      }
    }

    if (pastTimeSentenceObject === null) {
      // past utterances
      let isBreak = false;

      for (let i = p.currentUtteranceIndex - 1; i >= 0; i--) {
        for (
          let j = utteranceObjects[i].sentenceObjects.length - 1;
          j >= 0;
          j--
        ) {
          const testingSentenceObject = utteranceObjects[i].sentenceObjects[j];

          characterInterval += testingSentenceObject.sentence.length;

          if (testingSentenceObject.time !== "") {
            // This is pastTime
            pastTimeSentenceObject = testingSentenceObject;
            pastTimeUtteranceIndex = i;
            pastTimeSentenceIndex = j;

            isBreak = true;
            break;
          }
        }
        if (isBreak) {
          break;
        }
      }
    }

    if (pastTimeSentenceObject) {
      return {
        sentenceObject: pastTimeSentenceObject,
        utteranceIndex: pastTimeUtteranceIndex,
        sentenceIndex: pastTimeSentenceIndex,
        characterInterval,
      };
    } else {
      return null;
    }
  }

  private findNextTime(p: {
    currentSentence: SentenceObject;
    currentSentenceIndex: number;
    currentUtteranceIndex: number;
    utteranceObjects: UtteranceObject[];
  }) {
    let nextTimeSentenceObject: SentenceObject | null = null;
    let nextTimeSentenceIndex = p.currentSentenceIndex + 1;
    let nextTimeUtteranceIndex = p.currentUtteranceIndex;
    let characterInterval = 0;

    // sentences in the current utterance
    for (
      let j = p.currentSentenceIndex + 1;
      j < p.utteranceObjects[p.currentUtteranceIndex].sentenceObjects.length;
      j++
    ) {
      const testingSentenceObject =
        utteranceObjects[p.currentUtteranceIndex].sentenceObjects[j];

      characterInterval += testingSentenceObject.sentence.length;

      if (testingSentenceObject.time !== "") {
        // This is nextTime
        nextTimeSentenceObject = testingSentenceObject;
        nextTimeSentenceIndex = j;
        break;
      }
    }

    if (nextTimeSentenceObject === null) {
      // past utterances
      let isBreak = false;

      for (
        let i = p.currentUtteranceIndex + 1;
        i < p.utteranceObjects.length;
        i++
      ) {
        for (let j = 0; j < p.utteranceObjects[i].sentenceObjects.length; j++) {
          const testingSentenceObject = utteranceObjects[i].sentenceObjects[j];

          characterInterval += testingSentenceObject.sentence.length;

          if (testingSentenceObject.time !== "") {
            // This is pastTime
            nextTimeSentenceObject = testingSentenceObject;
            nextTimeUtteranceIndex = i;
            nextTimeSentenceIndex = j;

            isBreak = true;
            break;
          }
        }
        if (isBreak) {
          break;
        }
      }
    }

    if (nextTimeSentenceObject) {
      return {
        sentenceObject: nextTimeSentenceObject,
        utteranceIndex: nextTimeUtteranceIndex,
        sentenceIndex: nextTimeSentenceIndex,
        characterInterval,
      };
    } else {
      return null;
    }
  }

  /**
   *
   * @param vrewTime "00(hour):00(minite):07(second)"
   * @returns
   */
  private vrewTimeToSeconds(vrewTime: string): number {
    const splittedTime = vrewTime.split(":");

    const hour = Number(splittedTime[0]);
    const minute = Number(splittedTime[1]);
    const second = Number(splittedTime[2]);

    let seconds = 0;

    seconds += second;
    seconds += minute * 60;
    seconds += hour * 60 * 60;

    return seconds;
  }

  /**
   *
   * @param onlySecond OO seconds
   * @return OO:OO:OO
   */
  private secondToVrewTime(onlySecond: number): string {
    const hour = Math.floor(onlySecond / 3600);
    const hourString = `0${hour}`;

    const minute = Math.floor((onlySecond % 3600) / 60);
    let minuteString = "00";
    if (minute < 10) {
      minuteString = `0${minute}`;
    } else {
      minuteString = `${minute}`;
    }

    const second = Math.floor(onlySecond % 60);
    let secondString = "00";
    if (second < 10) {
      secondString = `0${second}`;
    } else {
      secondString = `${second}`;
    }

    return `${hourString}:${minuteString}:${secondString}`;
  }

  public get utteranceObjects() {
    return this._utteranceObjects;
  }

  private getMaxOfVrewTimeDiff(vrewSpokens: VrewSpoken[]) {
    const diffs: number[] = [];

    for (let i = 0; i < vrewSpokens.length - 1; i++) {
      const currentTime = this.vrewTimeToSeconds(vrewSpokens[i].time);
      const nextTime = this.vrewTimeToSeconds(vrewSpokens[i + 1].time);

      const diff = nextTime - currentTime;
      diffs.push(diff);
    }

    const max = _.max(diffs);

    return max;
  }

  /**
   * @changedVariable time in sentenceObjects in utteranceObjects
   * @param utteranceObjects
   */
  private fixTimeError(utteranceObjects: UtteranceObject[]) {
    let numOfError = 1;
    while (numOfError > 0) {
      numOfError = 0;
      _.forEach(utteranceObjects, (utteranceObject, utteranceIndex) => {
        _.forEach(
          utteranceObject.sentenceObjects,
          (sentenceObject, sentenceIndex) => {
            if (sentenceObject.time === "") {
              return true;
            }

            // get nextTimeDatasets
            const nextTimeDatasets: {
              sentenceObject: SentenceObject;
              utteranceIndex: number;
              sentenceIndex: number;
              characterInterval: number;
            }[] = [];

            const firstNextTimeDataset = this.findNextTime({
              currentSentence: sentenceObject,
              currentUtteranceIndex: utteranceIndex,
              currentSentenceIndex: sentenceIndex,
              utteranceObjects: utteranceObjects,
            });
            if (firstNextTimeDataset === null) {
              return true;
            }
            nextTimeDatasets.push(firstNextTimeDataset);

            for (let i = 0; i < 10; i++) {
              const lastNextTimeDataset =
                nextTimeDatasets[nextTimeDatasets.length - 1];
              const nextTimeDataset = this.findNextTime({
                currentSentence: lastNextTimeDataset.sentenceObject,
                currentUtteranceIndex: lastNextTimeDataset.utteranceIndex,
                currentSentenceIndex: lastNextTimeDataset.sentenceIndex,
                utteranceObjects: utteranceObjects,
              });

              if (nextTimeDataset) {
                nextTimeDatasets.push(nextTimeDataset);
              } else {
                break;
              }
            }

            // [currentTime, nextTime1, nextTime2, nextTime3, nextTime4, nextTime5, nextTime6]
            // [120, 200, 125, 126, 127, 134, 137]
            // [120, 10, 125, 126, 127, 134, 137]

            const currentTime = this.vrewTimeToSeconds(sentenceObject.time);
            const secondTimes: number[] = [currentTime];

            _.forEach(nextTimeDatasets, (nextTimeDataset) => {
              const secondTime = this.vrewTimeToSeconds(
                nextTimeDataset.sentenceObject.time
              );
              secondTimes.push(secondTime);
            });

            let sum1 = 0;
            secondTimes[0]; // others
            _.forEach(secondTimes, (secondTime, secondTimeIndex) => {
              if (secondTimeIndex === 0) {
                return true;
              }

              sum1 += Math.abs(secondTime - secondTimes[0]);
            });

            let sum2 = 0;
            secondTimes[1]; // others
            _.forEach(secondTimes, (secondTime, secondTimeIndex) => {
              if (secondTimeIndex === 1) {
                return true;
              }
              sum2 += Math.abs(secondTime - secondTimes[1]);
            });

            if (
              Math.abs(secondTimes[0] - secondTimes[1]) >
              firstNextTimeDataset.characterInterval
            ) {
              numOfError++;
              if (sum1 > sum2) {
                sentenceObject.time = "";
              } else {
                firstNextTimeDataset.sentenceObject.time = "";
              }
            }
          }
        );
      });
    }
  }

  private fillEmptyTime(utteranceObjects: UtteranceObject[]) {
    _.forEach(utteranceObjects, (utteranceObject, utteranceIndex) => {
      _.forEach(
        utteranceObject.sentenceObjects,
        (sentenceObject, sentenceIndex) => {
          if (sentenceObject.time === "") {
            // find past interval
            // find past time
            const pastTimeDataset = this.findPastTime({
              currentSentence: sentenceObject,
              currentUtteranceIndex: utteranceIndex,
              currentSentenceIndex: sentenceIndex,
              utteranceObjects: utteranceObjects,
            });
            // find next interval
            // find next time
            const nextTimeDataset = this.findNextTime({
              currentSentence: sentenceObject,
              currentUtteranceIndex: utteranceIndex,
              currentSentenceIndex: sentenceIndex,
              utteranceObjects: utteranceObjects,
            });

            if (pastTimeDataset && nextTimeDataset) {
              const pastSecondTime = this.vrewTimeToSeconds(
                pastTimeDataset.sentenceObject.time
              );
              const pastTimeCharacterInterval =
                pastTimeDataset.characterInterval;
              const nextSecondTime = this.vrewTimeToSeconds(
                nextTimeDataset.sentenceObject.time
              );
              const nextTimeCharacterInterval =
                nextTimeDataset.characterInterval;

              const theSecondTime =
                pastSecondTime +
                Math.round(
                  ((nextSecondTime - pastSecondTime) /
                    (pastTimeCharacterInterval + nextTimeCharacterInterval)) *
                    pastTimeCharacterInterval
                );

              sentenceObject.time = this.secondToVrewTime(theSecondTime);
            }

            //
            // (nextSecondTime - pastSecondTime) / (pastInterval + nextInterval) * pastInterval
            //
          }
        }
      );
    });
  }

  //
}

if (require.main === module) {
  const timeInserter = new TimeInserter(utteranceObjects, vrewTranscript);

  // console.log("timeInserter.utteranceObjects", timeInserter.utteranceObjects);

  fs.writeFileSync(
    pathOfUtteranceObjects,
    JSON.stringify(timeInserter.utteranceObjects)
  );
  console.log(`${pathOfUtteranceObjects} is made.`);

  console.log("process end");
}
