import * as React from "react";
import * as ReactDOM from "react-dom";
import { App } from "./app";

const productionContext = {
  getDot: async () => {
    let response = await fetch("/graph.dot");
    return response.text();
  },
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
};

ReactDOM.render(
  <App context={productionContext} />,
  document.getElementById("root")
);
