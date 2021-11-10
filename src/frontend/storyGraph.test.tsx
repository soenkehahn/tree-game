import { StoryGraph } from "./storyGraph";

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
  expect(graph.isCorrect()).toEqual(false);
  graph.nextSnippet();
  expect(graph.isCorrect()).toEqual(false);
  graph.nextSnippet();
  expect(graph.isCorrect()).toEqual(false);
  graph.handleInput("ArrowDown");
  expect(graph.isCorrect()).toEqual(true);
});
