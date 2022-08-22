/**
 * Code of making raw_transcript to cleaned_transcript
 */

import fs from "fs";
import _ from "lodash";

// TODO Select debate name
// const debateName = "sample";
// const debateName = "기본소득";
// const debateName = "정시확대";
// const debateName = "모병제";
// const debateName = "집값";
// const debateName = "정년연장";
const debateName = "지방소멸"; // 잘 나옴

// TODO Not only OS... But we can choose "linux&mac" or "windows"
const operatingSystemType: OperatingSystemType = "windows";

// paths
const pathOfRawTranscript = `../data/${debateName}/raw_transcript.txt`;
const pathOfCleanedTranscript = `../data/${debateName}/cleaned_transcript.txt`;

// 1. read raw_transcript file
const rawTranscript: string = fs.readFileSync(pathOfRawTranscript, "utf-8");

type OperatingSystemType = "linux&mac" | "windows";

/**
 * Text Cleaner to remove duplicate part
 */
class TranscriptCleaner {
  private _cleanedTranscript: string;

  constructor(rawTranscript: string, operatingSystemType: OperatingSystemType) {
    const noEmptyLineTranscript: string = this.removeEmptyLine(rawTranscript);
    this._cleanedTranscript = this.removeDuplicatePart(
      noEmptyLineTranscript,
      operatingSystemType
    );
  }

  public get cleanedTranscript() {
    return this._cleanedTranscript;
  }

  /**
   * Remove empty line from original text
   * @param rawText
   */
  private removeEmptyLine(rawText: string): string {
    const resultText = rawText.replace(/\n\n+/gi, "\n");
    return resultText;
  }

  /**
   * Delete dupicate part from original text
   * @param originalText
   */
  private removeDuplicatePart(
    originalText: string,
    operatingSystemType: OperatingSystemType
  ): string {
    const lineSeperator = operatingSystemType === "linux&mac" ? "\n" : "\r\n";

    const textLines = originalText.split(lineSeperator);
    // console.log("textLines", textLines);

    let baseLineForDeleting = "";
    for (let i = 0; i < textLines.length - 1; i++) {
      const currentLine = textLines[i];
      const nextLine = textLines[i + 1];

      if (baseLineForDeleting !== "") {
        if (baseLineForDeleting.includes(currentLine)) {
          if (!nextLine.includes("◎")) textLines[i] = "";
        } else {
          baseLineForDeleting = "";
        }
      }

      if (baseLineForDeleting === "") {
        if (currentLine.includes(nextLine)) {
          baseLineForDeleting = currentLine;
        }
      }
    }

    // Arrange textLines
    const newTextLines: string[] = _.filter(
      textLines,
      (textLine) => textLine !== ""
    );

    // Second filter to delete first duplicate part.
    for (let i = 0; i < newTextLines.length - 1; i++) {
      const currentLine = newTextLines[i];
      const nextLine = newTextLines[i + 1];
      const samePart = this.findSamePart(currentLine, nextLine);
      const reg = new RegExp(samePart + "$");
      if (samePart.length > 0) {
        newTextLines[i] = currentLine.replace(reg, "");
      }
    }

    return newTextLines.join("\n");
  }

  /**
   * Find duplicate text part of currentLine's end part and nextLine's next part
   * @param currentText
   * @param nextText
   */
  private findSamePart(currentText: string, nextText: string): string {
    // start findingText at nextText's first point
    // If we can find findingText at currentText,
    // Add nextLine's character to findingText.
    // If finding text processing is end, the findingText can be found at currentText's end point
    // Then return the string

    let findingText = "";
    for (let i = 0; i < nextText.length - 1; i++) {
      const candidate = findingText + nextText[i];
      if (currentText.includes(candidate)) {
        findingText = candidate;
      } else {
        break;
      }
    }

    for (let j = 0; j < findingText.length; j++) {
      if (
        currentText[currentText.length - findingText.length + j] !==
        findingText[j]
      ) {
        findingText = "";
        break;
      }
    }

    return findingText;
  }
}

if (require.main === module) {
  const transcriptCleaner = new TranscriptCleaner(
    rawTranscript,
    operatingSystemType
  );

  fs.writeFileSync(
    pathOfCleanedTranscript,
    transcriptCleaner.cleanedTranscript
  );

  console.log(`'${pathOfCleanedTranscript}' is made.`);
  console.log("process end");
}
