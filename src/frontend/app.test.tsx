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

async function setUpTest(
  story: Array<Array<string>>,
  withCancellations: boolean = false
): Promise<{ resolve: () => Promise<void>; spokenSnippets: Array<string> }> {
  let spokenSnippets: Array<string> = [];
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
      spokenSnippets.push(snippet);
      return new Promise((res) => {
        mutableResolve = res;
      });
    },
    cancelSpeech: async () => {
      if (withCancellations) {
        spokenSnippets.push("cancelled");
      }
      mutableResolve();
      await null;
    },
  };
  await startGame(testContext);
  return { resolve, spokenSnippets };
}

test("Renders the first speech snippet", async () => {
  let { spokenSnippets } = await setUpTest([["a"]]);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
});

test("Waits for one speech snippet to finish before synthesizing the next", async () => {
  let { spokenSnippets, resolve } = await setUpTest([["a"]]);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "a"]);
});

test("Loops through first options", async () => {
  let { spokenSnippets, resolve } = await setUpTest([
    ["a"],
    ["b", "n"],
    ["c", "n", "m"],
  ]);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c", "a"]);
});

test("Pressing an arrow key will change an option", async () => {
  let { spokenSnippets, resolve } = await setUpTest([["a", "b"], ["c"]]);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c", "b"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c", "b", "c"]);
});

test("Loops around options", async () => {
  let { spokenSnippets, resolve } = await setUpTest([["a", "b"]]);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a", "a"]);
});

test("Up and down arrow keys work", async () => {
  let { resolve, spokenSnippets } = await setUpTest([["a", "b", "c"]]);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a"]);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a", "c"]);
});

test("Allows to change later options", async () => {
  let { resolve, spokenSnippets } = await setUpTest([["a"], ["b", "c"]]);
  expect(spokenSnippets).toEqual(["a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c", "a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "c", "a", "c"]);
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
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
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
  let { resolve, spokenSnippets } = await setUpTest([["a", "b"], ["c"]], true);
  expect(spokenSnippets).toEqual(["a"]);
  await act(async () => {
    userEvent.keyboard("{arrowdown}");
  });
  expect(spokenSnippets).toEqual(["a", "cancelled", "b"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "cancelled", "b", "c"]);
});

test("does not switch to next option when cancelling", async () => {
  let { spokenSnippets } = await setUpTest([["a", "b"], ["c"]], true);
  expect(spokenSnippets).toEqual(["a"]);
  await act(async () => {
    userEvent.keyboard("{arrowdown}");
  });
  // fixme: uncomment
  expect(spokenSnippets).toEqual(["a", "cancelled", "b"]);
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
