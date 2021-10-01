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
  let { spokenSnippets } = await setUpTest(`
    digraph g {
      a -> b;
    }
  `);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
});

test("Waits for one speech snippet to finish before synthesizing the next", async () => {
  let { spokenSnippets, resolve } = await setUpTest(`
    digraph g {
      a -> b;
    }
  `);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "a"]);
});

test("Starts with one snippet on repeat", async () => {
  let { spokenSnippets, resolve } = await setUpTest(`
    digraph g {
      a -> b;
    }
  `);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["a"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["a", "a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["a", "a", "a"]);
});

test("Pressing an arrow key will add a snippet to the path", async () => {
  let { resolve, spokenSnippets } = await setUpTest(`
    digraph g {
      s -> a;
      s -> b;
    }
  `);
  await waitFor(() => {
    expect(spokenSnippets).toEqual(["s"]);
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "s"]);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "s", "a"]);
  await resolve();
  expect(spokenSnippets).toEqual(["s", "s", "a", "s"]);
});

test("Allows to select different snippets", async () => {
  let { resolve, spokenSnippets } = await setUpTest(`
    digraph g {
      s -> up;
      s -> down;
    }
  `);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "down"]);
});

test("Multiple arrow presses work", async () => {
  let { resolve, spokenSnippets } = await setUpTest(`
    digraph g {
      s -> up;
      up -> not;
      up -> down;
    }
  `);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "up"]);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "up", "down"]);
});

test("All arrow keys work", async () => {
  let { resolve, spokenSnippets } = await setUpTest(`
    digraph g {
      s -> up;

      up -> a;
      up -> down;

      down -> b;
      down -> c;
      down -> left;

      left -> d;
      left -> e;
      left -> f;
      left -> right;
    }
  `);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  act(() => {
    userEvent.keyboard("{arrowleft}");
  });
  await resolve();
  act(() => {
    userEvent.keyboard("{arrowright}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "up", "down", "left", "right"]);
});

test("Allows to change path of snippets", async () => {
  let { resolve, spokenSnippets } = await setUpTest(`
    digraph g {
      s -> up;
      s -> down;
    }
  `);
  act(() => {
    userEvent.keyboard("{arrowdown}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "down"]);
  await resolve();
  expect(spokenSnippets).toEqual(["s", "down", "s"]);
  act(() => {
    userEvent.keyboard("{arrowup}");
  });
  await resolve();
  expect(spokenSnippets).toEqual(["s", "down", "s", "up"]);
});
