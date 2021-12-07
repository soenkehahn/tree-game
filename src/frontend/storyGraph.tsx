// import { trace } from "./utils";

export type Level = {
  options: Array<Array<string>>;
  goal: string;
};

type LevelState = {
  goal: string;
  phrase: Array<[number, Array<string>]>;
  index: number;
  cancelling: boolean;
};

function toLevelState(input: {
  options: Array<Array<string>>;
  goal: string;
}): LevelState {
  let phrase: Array<[number, Array<string>]> = [];
  for (let options of input.options) {
    let stateOptions = [];
    for (let option of options) {
      stateOptions.push(option);
    }
    phrase.push([0, stateOptions]);
  }
  return {
    goal: input.goal,
    phrase,
    index: -1,
    cancelling: false,
  };
}

function currentOptions(state: LevelState): [number, Array<string>] {
  let options = state.phrase[state.index];
  if (options === undefined) {
    throw `fixme: options undefined: ${state.index}`;
  }
  return options;
}

export function isCorrect(state: LevelState): boolean {
  const levelUi = toLevelUi(state);
  return state.goal === levelUi.map((x) => x.snippet).join(" ");
}

function handleInput(state: LevelState, key: string) {
  let current = currentOptions(state);
  let [index, options] = current;
  if (key === "ArrowDown") {
    index = index + 1;
  } else if (key === "ArrowUp") {
    index = index - 1;
  }
  if (index >= options.length) {
    index = 0;
  } else if (index < 0) {
    index = options.length - 1;
  }
  current[0] = index;
  state.cancelling = true;
}

type LevelUi = Array<{ snippet: string; focused: boolean }>;

function toLevelUi(state: LevelState): LevelUi {
  const result: GameUi = [];
  for (const [i, [index, options]] of Array.from(state.phrase.entries())) {
    const snippet = options[index];
    if (snippet === undefined) {
      throw "fixme";
    }
    result.push({ snippet, focused: i === state.index });
  }
  return result;
}

export class StoryGraph {
  state: LevelState | undefined;
  restLevels: Array<Level>;

  constructor(story: Array<Level>) {
    this.state = undefined;
    this.restLevels = story;
    this.nextLevel();
  }

  nextLevel(): "no more levels" | "more levels" {
    let next = this.restLevels.shift();
    if (next === undefined) {
      this.state = undefined;
      return "no more levels";
    } else {
      this.state = toLevelState(next);
      return "more levels";
    }
  }

  nextSnippet(): string | "end of game" {
    if (this.state === undefined) {
      return "end of game";
    }
    if (!this.state.cancelling) {
      this.state.index = this.state.index + 1;
      if (this.state.index >= this.state.phrase.length) {
        if (isCorrect(this.state)) {
          if (this.nextLevel() == "no more levels") {
            return "end of game";
          }
        }
        this.state.index = 0;
      }
    }
    this.state.cancelling = false;
    let [i, options] = currentOptions(this.state);
    let result = options[i];
    if (result === undefined) {
      throw `fixme`;
    }
    return result;
  }

  handleInput(key: string) {
    if (this.state === undefined) {
      return;
    }
    handleInput(this.state, key);
  }

  toGameUi(): GameUi {
    if (this.state === undefined) {
      return "end of game";
    }
    return toLevelUi(this.state);
  }

  debug(): string {
    if (this.state === undefined) {
      return "no levels left";
    }
    let result = "";
    for (const [index, options] of Array.from(this.state.phrase.entries())) {
      let option = options[1][options[0]];
      if (index === this.state.index) {
        result += `[${option}] `;
      } else {
        result += ` ${option}  `;
      }
    }
    return result.trimEnd();
  }
}

export type GameUi = LevelUi | "end of game";
