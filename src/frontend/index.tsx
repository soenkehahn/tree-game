import * as React from "react";
import * as ReactDOM from "react-dom";
import { App, Context } from "./app";
import levels from "./story.yaml";

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
};

ReactDOM.render(
  <App context={productionContext} />,
  document.getElementById("root")
);
