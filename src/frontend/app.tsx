import * as React from "react";
import { useState, useEffect } from "react";
import { StoryGraph } from "./storyGraph";
import { Scene } from "./scene";

export type Context = {
  getDot: () => Promise<string>;
  renderSpeech: (snippet: string) => Promise<void>;
};

type State = {
  playing: boolean;
  graph: StoryGraph;
};

export const App = ({ context }: { context: Context }) => {
  let [state, setState] = useState<null | State>(null);

  useEffect(() => {
    (async () => {
      if (!state) {
        const dot = await context.getDot();
        const graph = new StoryGraph(dot);
        setState({
          playing: false,
          graph,
        });
      }
    })();
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
    if (!state.playing) {
      let snippet = state.graph.nextSnippet();
      if (snippet) {
        (async () => {
          setState((state: State) => ({
            ...state,
            playing: true,
            graph: state.graph,
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
      setState((state) => {
        return { ...state, graph: state.graph };
      });
    };
    let type = "keydown";
    document.addEventListener(type, callback as any);
    return () => document.removeEventListener(type, callback as any);
  }, []);

  return <Scene phrase={state.graph.currentPhrase()} />;
};
