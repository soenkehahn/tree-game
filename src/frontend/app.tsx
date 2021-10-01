import * as React from "react";
import { useState, useEffect } from "react";
import dotparser from "dotparser";
import { Graph } from "dotparser";

export type Context = {
  getDot: () => Promise<string>;
  renderSpeech: (snippet: string) => Promise<void>;
};

type StoryGraph = Map<string, Array<string>>;

function parseGraph(graphs: Array<Graph>): StoryGraph {
  let result = new Map();
  for (let graph of graphs) {
    for (let child of graph.children) {
      if (child.type === "edge_stmt") {
        if (child.edge_list.length !== 2) {
          throw "fixme";
        }
        const a = child.edge_list[0];
        if (!a || a.type !== "node_id" || typeof a.id === "number") {
          throw "fixme";
        }
        const b = child.edge_list[1];
        if (!b || b.type !== "node_id" || typeof b.id === "number") {
          throw "fixme";
        }
        if (!result.has(a.id)) {
          result.set(a.id, []);
        }
        result.get(a.id).push(b.id);
      }
    }
  }
  return result;
}

type State = {
  current: number;
  playing: boolean;
  path: Array<string>;
  queue: Array<string>;
  graph: StoryGraph;
};

export const App = ({ context }: { context: Context }) => {
  let [state, setState] = useState<null | State>(null);

  useEffect(() => {
    (async () => {
      if (!state) {
        const dot = await context.getDot();
        const graph = parseGraph(dotparser(dot));
        let queue: Array<string> = [];
        graph.forEach((bs, a) => {
          queue.push(a);
          bs.forEach((b) => {
            queue.push(b);
          });
        });
        let first = queue.shift();
        if (!first) {
          throw "fixme";
        }
        setState({
          current: 0,
          playing: false,
          path: [first],
          queue,
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
      setState((state: State) => ({ ...state, playing: true }));
      let new_current = state.current + 1;
      if (new_current >= state.path.length) {
        new_current = 0;
      }
      setState((state: State) => ({ ...state, current: new_current }));
      let snippet = state.path[new_current];
      if (snippet) {
        (async () => {
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
      setState((state) => {
        let current = state.path[state.current];
        if (current === undefined) {
          return state;
        }
        let outs = state.graph.get(current);
        if (outs === undefined) {
          return state;
        }
        let outsIndex = mkIndex(event.key);
        if (outsIndex === undefined) {
          return state;
        }
        let next = outs[outsIndex];
        if (next) {
          state.path = state.path.slice(0, state.current + 1);
          state.path.push(next);
        }
        return { ...state, path: state.path };
      });
    };
    let type = "keydown";
    document.addEventListener(type, callback as any);
    return () => document.removeEventListener(type, callback as any);
  }, []);

  return (
    <div>
      {JSON.stringify(state.path)}
      <br />
      {state.path[state.current]}
    </div>
  );
};

function mkIndex(key: string): undefined | number {
  return {
    ArrowUp: 0,
    ArrowDown: 1,
    ArrowLeft: 2,
    ArrowRight: 3,
  }[key];
}
