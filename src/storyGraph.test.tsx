import { StoryGraph, isCorrect } from "./storyGraph";

test("parses stories", () => {
  let graph = new StoryGraph([
    {
      options: [
        ["a", "b"],
        ["c", "d"],
      ],
      goal: "a c",
    },
  ]);
  expect(graph.state?.phrase).toEqual([
    [0, ["a", "b"]],
    [0, ["c", "d"]],
  ]);
});

test(".isCorrect() returns whether options are selected correctly", () => {
  let graph = new StoryGraph([
    {
      options: [
        ["a", "b"],
        ["c", "d"],
      ],
      goal: "a d",
    },
  ]);
  expect(isCorrect(graph.state as any)).toEqual(false);
  expect(graph.nextSnippet()).toEqual("a");
  expect(isCorrect(graph.state as any)).toEqual(false);
  expect(graph.nextSnippet()).toEqual("c");
  expect(isCorrect(graph.state as any)).toEqual(false);
  graph.handleInput("ArrowDown");
  expect(isCorrect(graph.state as any)).toEqual(true);
});
