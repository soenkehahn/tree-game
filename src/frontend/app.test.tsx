import "@testing-library/jest-dom";
import { render, waitFor, screen } from "@testing-library/react";
import { App, Context } from "./app";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import * as React from "react";

async function startGame(context: Context) {
  render(<App {...{ context }} />);
  await waitFor(() => {
    screen.getByText("play").click();
  });
}

async function setUpTest(
  graph: string
): Promise<{ resolve: () => void; spokenSnippets: Array<string> }> {
  let spokenSnippets: Array<string> = [];
  let mutableResolve = () => {};
  let resolve = async () => {
    mutableResolve();
    await act(async () => {
      await null;
    });
  };
  let testContext: Context = {
    getDot: async () => {
      return graph;
    },
    renderSpeech: (snippet: string): Promise<void> => {
      spokenSnippets.push(snippet);
      return new Promise((res) => {
        mutableResolve = res;
      });
    },
  };
  await startGame(testContext);
  return { resolve, spokenSnippets };
}

test("Renders the first speech snippet", async () => {
  let { spokenSnippets } = await setUpTest(`[[a]]`);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
});

test("Waits for one speech snippet to finish before synthesizing the next", async () => {
  let { spokenSnippets, resolve } = await setUpTest(`[[a]]`);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "a"]);
});

test("Loops through first options", async () => {
  let { spokenSnippets, resolve } = await setUpTest(`[[a], [b, n], [c, n, m]]`);
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
  let { spokenSnippets, resolve } = await setUpTest(`[[a, b], [c]]`);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "c"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "c", "b"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "c", "b", "c"]);
});

test("Loops around options", async () => {
  let { spokenSnippets, resolve } = await setUpTest(`[[a, b]]`);
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
  let { resolve, spokenSnippets } = await setUpTest(`[[a, b, c]]`);
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
  let { resolve, spokenSnippets } = await setUpTest(`[[a], [b, c]]`);
  expect(spokenSnippets).toEqual(["a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b"]);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "b", "a", "c"]);
});

test("Renders state", async () => {
  let { resolve } = await setUpTest(`[[a, b], [c]]`);
  expect(screen.getByTitle("main").textContent?.trim()).toEqual("[a]  c");
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(screen.getByTitle("main").textContent?.trim()).toEqual("b  [c]");
  await resolve();
  expect(screen.getByTitle("main").textContent?.trim()).toEqual("[b]  c");
});
