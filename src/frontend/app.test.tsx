import "@testing-library/jest-dom";
import { Scene } from "./scene";
import { render, waitFor, screen } from "@testing-library/react";
import { App, Context } from "./app";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import * as React from "react";

jest.mock("./scene", () => {
  return {
    Scene: jest.fn(() => {
      return null;
    }),
  };
});

beforeEach(() => jest.clearAllMocks());

function lastCall(mock: any): Array<any> {
  const calls = mock.mock.calls;
  return calls[calls.length - 1];
}

async function startGame(context: Context) {
  render(<App {...{ context }} />);
  await waitFor(() => {
    screen.getByText("play").click();
  });
}

async function setUpTest(story: Array<Array<string>>): Promise<{
  resolve: () => Promise<void>;
  getSnippets: () => Array<string>;
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
    story,
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
  };
  await startGame(testContext);
  return { resolve, getSnippets };
}

async function pressKey(key: string): Promise<void> {
  await act(async () => {
    userEvent.keyboard(`{${key}}`);
    await null;
  });
}

test("Renders the first speech snippet", async () => {
  let { getSnippets } = await setUpTest([["a"]]);
  expect(getSnippets()).toEqual(["a"]);
});

test("Waits for one speech snippet to finish before synthesizing the next", async () => {
  let { resolve, getSnippets } = await setUpTest([["a"]]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["a"]);
});

test("Loops through first options", async () => {
  let { resolve, getSnippets } = await setUpTest([
    ["a"],
    ["b", "n"],
    ["c", "n", "m"],
  ]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
  await resolve();
  expect(getSnippets()).toEqual(["a"]);
});

test("Pressing an arrow key will change an option", async () => {
  let { getSnippets, resolve } = await setUpTest([["a", "b"], ["c"]]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
  await resolve();
  expect(getSnippets()).toEqual(["b"]);
});

test("Loops around options", async () => {
  let { resolve, getSnippets } = await setUpTest([["a", "b"]]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "a"]);
  await resolve();
  expect(getSnippets()).toEqual(["a"]);
});

test("Up and down arrow keys work", async () => {
  let { getSnippets } = await setUpTest([["a", "b", "c"]]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await pressKey("arrowup");
  expect(getSnippets()).toEqual(["cancelled", "a"]);
  await pressKey("arrowup");
  expect(getSnippets()).toEqual(["cancelled", "c"]);
});

test("Allows to change later options", async () => {
  let { getSnippets, resolve } = await setUpTest([["a"], ["b", "c"]]);
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["b"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "c"]);
  await resolve();
  expect(getSnippets()).toEqual(["a"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
});

test("Renders state", async () => {
  let { resolve } = await setUpTest([["a", "b"], ["c"]]);
  expect(lastCall(Scene)).toEqual([
    {
      phrase: [
        { snippet: "a", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
  await pressKey("arrowdown");
  expect(lastCall(Scene)).toEqual([
    {
      phrase: [
        { snippet: "b", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
  await resolve();
  expect(lastCall(Scene)).toEqual([
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
  let { getSnippets, resolve } = await setUpTest([["a", "b"], ["c"]]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  await resolve();
  expect(getSnippets()).toEqual(["c"]);
});

test("does not switch to next option when cancelling", async () => {
  let { getSnippets } = await setUpTest([["a", "b"], ["c"]]);
  expect(getSnippets()).toEqual(["a"]);
  await pressKey("arrowdown");
  expect(getSnippets()).toEqual(["cancelled", "b"]);
  expect(lastCall(Scene)).toEqual([
    {
      phrase: [
        { snippet: "b", focused: true },
        { snippet: "c", focused: false },
      ],
    },
    {},
  ]);
});
