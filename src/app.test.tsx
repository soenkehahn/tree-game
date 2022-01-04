import "@testing-library/jest-dom";
import { render, waitFor, screen } from "@testing-library/react";
import { App, Context } from "./app";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import * as React from "react";
import { Level } from "./storyGraph";

async function startGame(context: Context) {
  render(<App {...{ context }} />);
  await waitFor(() => {
    screen.getByText("play").click();
  });
}

async function setUpTest(levels: Array<Level>): Promise<{
  resolve: () => Promise<void>;
  getSnippets: () => Array<string>;
  lastSceneCall: () => null | Array<unknown>;
}> {
  let snippets: Array<string> = [];
  let getSnippets = () => {
    const result = snippets;
    snippets = [];
    return result;
  };
  let mutableResolve = () => {};
  let resolve = async () => {
    mutableResolve();
    await act(async () => {
      await null;
    });
  };
  let testContext: Context = {
    levels,
    renderSpeech: (snippet: string): Promise<void> => {
      snippets.push(snippet);
      return new Promise((res) => {
        mutableResolve = res;
      });
    },
    cancelSpeech: () => {
      snippets.push("cancelled");
      mutableResolve();
    },
    Scene: (...args) => {
      lastSceneCall = args;
      return <div />;
    },
    errorBuzzer: () => {
      snippets.push("errorBuzzer");
      return new Promise((res) => {
        mutableResolve = res;
      });
    },
  };
  let lastSceneCall: null | Array<unknown> = null;
  await startGame(testContext);
  return { resolve, getSnippets, lastSceneCall: () => lastSceneCall };
}

async function pressKey(key: string): Promise<void> {
  await act(async () => {
    userEvent.keyboard(`{${key}}`);
    await null;
  });
}

test("Renders the first speech snippet", async () => {
  let { getSnippets } = await setUpTest([{ options: [["a"]], goal: "a" }]);
  expect(getSnippets()).toEqual(["a"]);
});

test("Waits for one speech snippet to finish before synthesizing the next", async () => {
  let { resolve, getSnippets } = await setUpTest([
    {
      options: [["a"]],
      goal: "foo",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer", "a"]);
});

test("Loops through first options", async () => {
  let { resolve, getSnippets } = await setUpTest([
    {
      options: [["a"], ["b", "n"], ["c", "n", "m"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer", "a"]);
});

test("Pressing an arrow key will change an option", async () => {
  let { getSnippets, resolve } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer", "b"]);
});

test("Loops around options", async () => {
  let { resolve, getSnippets } = await setUpTest([
    {
      options: [["a", "b"]],
      goal: "foo",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "a"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer", "a"]);
});

test("Up and down arrow keys work", async () => {
  let { getSnippets } = await setUpTest([
    {
      options: [["a", "b", "c"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await pressKey("arrowup");
  expect(getSnippets()).toEqual(["cancelled", "a"]);
  await pressKey("arrowup");
  expect(getSnippets()).toEqual(["cancelled", "c"]);
});

test("Allows to change later options", async () => {
  let { getSnippets, resolve } = await setUpTest([
    {
      options: [["a"], ["b", "c"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["b"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "c"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer", "a"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
});

test("Renders state", async () => {
  let { resolve, lastSceneCall } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "a",
    },
  ]);
  expect(lastSceneCall()).toEqual([
    {
      phrase: [
        { snippet: "a", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
  await pressKey("arrowdown");
  expect(lastSceneCall()).toEqual([
    {
      phrase: [
        { snippet: "b", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
  await resolve();
  expect(lastSceneCall()).toEqual([
    {
      phrase: [
        { snippet: "b", focused: false },
        { snippet: "c", focused: true },
      ],
    },
    {},
  ]);
});

test("Cancels current spoken snippets and restarts speaking the new choice", async () => {
  let { getSnippets, resolve } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
});

test("does not switch to next option when cancelling", async () => {
  let { getSnippets, lastSceneCall } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "a",
    },
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  expect(lastSceneCall()).toEqual([
    {
      phrase: [
        { snippet: "b", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
});

test("plays an error buzzer when at the end of a wrong phrase", async () => {
  let { resolve, getSnippets } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "b c",
    },
  ]);
  await resolve();
  expect(getSnippets()).toEqual(["a", "c"]);
  await resolve();
  expect(getSnippets()).toEqual(["errorBuzzer"]);
  await resolve();
  expect(getSnippets()).toEqual(["a"]);
});

test("moves to the next level when correct options are selected", async () => {
  let { resolve, getSnippets, lastSceneCall } = await setUpTest([
    {
      options: [["a", "b"], ["c"]],
      goal: "b c",
    },
    {
      options: [["next"], ["level"]],
      goal: "next level",
    },
  ]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["a", "cancelled", "b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
  await resolve();
  expect(getSnippets()).toEqual(["next"]);
  await resolve();
  expect(getSnippets()).toEqual(["level"]);
  await resolve();
  expect(lastSceneCall()).toEqual([{ phrase: "end of game" }, {}]);
});
