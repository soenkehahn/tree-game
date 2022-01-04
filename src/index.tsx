import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, Context } from "./app";
import levels from "./story.yaml";
import { Scene } from "./scene";

// @ts-ignore
const audioUrl = new URL("./sounds/buzzer.wav", import.meta.url);
console.log(audioUrl);
export const buzzer = new Audio(audioUrl.toString());

const productionContext: Context = {
  levels,
  renderSpeech: (snippet: string): Promise<void> => {
    const utterance = new SpeechSynthesisUtterance(snippet);
    if (utterance) {
      window.speechSynthesis.speak(utterance);
      return new Promise((resolve) => {
        utterance.onend = (_event: SpeechSynthesisEvent) => {
          resolve();
        };
      });
    } else {
      return Promise.resolve();
    }
  },
  cancelSpeech: () => {
    window.speechSynthesis.cancel();
  },
<<<<<<< HEAD
  Scene,
||||||| parent of 9db82ed (panic commit)
=======
  errorBuzzer: () =>
    new Promise<void>((resolve) => {
      console.log("playing");
      buzzer.play();
      buzzer.addEventListener("ended", () => resolve());
    }),
>>>>>>> 9db82ed (panic commit)
};

ReactDOM.render(
  <App context={productionContext} />,
  document.getElementById("root")
);
