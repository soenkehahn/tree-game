import * as React from "react";
import { GameUi } from "./storyGraph";
import { useState, useEffect } from "react";
import { StoryGraph, Level } from "./storyGraph";

export type Context = {
  levels: Array<Level>;
  renderSpeech: (snippet: string) => Promise<void>;
  cancelSpeech: () => void;
  Scene: ({ phrase }: { phrase: GameUi }) => JSX.Element;
  errorBuzzer: () => Promise<void>;
};

type State = {
  playing: boolean;
  graph: StoryGraph;
  done: boolean;
};

export const App = ({ context }: { context: Context }) => {
  let [state, setState] = useState<null | State>(null);

  useEffect(() => {
    if (!state) {
      const graph = new StoryGraph(context);
      setState({
        playing: false,
        graph,
        done: false,
      });
    }
  }, []);

  let [started, setStarted] = useState(false);
  if (!started) {
    return <button onClick={() => setStarted(true)}>play</button>;
  }

  if (!state) {
    return <>fixme</>;
  }

  return <Game context={context} initialState={state} />;
};

const Game = ({
  context,
  initialState,
}: {
  context: Context;
  initialState: State;
}) => {
  let [state, setState] = useState(initialState);

  useEffect(() => {
    if (!state.playing && !state.done) {
      let snippet = state.graph.nextSnippet();
      if (snippet === "end of game") {
        setState((state: State) => ({ ...state, done: true }));
      } else {
        (async () => {
          setState((state: State) => ({
            ...state,
            playing: true,
          }));
          await context.renderSpeech(snippet);
          setState((state: State) => ({
            ...state,
            playing: false,
          }));
        })();
      }
    }
  }, [state]);

  useEffect(() => {
    const callback = (event: KeyboardEvent) => {
      state.graph.handleInput(event.key);
      context.cancelSpeech();
      setState((state) => ({ ...state, graph: state.graph }));
    };
    let type = "keydown";
    document.addEventListener(type, callback as any);
    return () => document.removeEventListener(type, callback as any);
  }, []);

  return <context.Scene phrase={state.graph.toGameUi()} />;
};
