// import { trace } from "./utils";

export type Level = {
  options: Array<Array<string>>;
  goal: string;
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

type LevelState = {
  goal: string;
  phrase: Array<[number, Array<string>]>;
  index: number;
  cancelling: boolean;
};

export class StoryGraph {
  state: LevelState | undefined;
  restLevels: Array<Level>;

  constructor(story: Array<Level>) {
    this.state = undefined;
    this.restLevels = story;
    this.nextLevel();
  }

  nextLevel() {
    let next = this.restLevels.shift();
    if (next === undefined) {
      this.state = undefined;
      return false;
    } else {
      this.state = toLevelState(next);
      return true;
    }
  }

  isCorrect(): boolean {
    const uiValues = this.toUiValues();
    if (uiValues === "end of game" || this.state === undefined) {
      return false;
    }
    return this.state.goal === uiValues.map((x) => x.snippet).join(" ");
  }

  currentOptions(state: LevelState): [number, Array<string>] {
    let options = state.phrase[state.index];
    if (options === undefined) {
      throw `fixme: options undefined: ${state.index}`;
    }
    return options;
  }

  nextSnippet(): string | "end of game" {
    if (this.state === undefined) {
      return "end of game";
    }
    if (!this.state.cancelling) {
      this.state.index = this.state.index + 1;
      if (this.state.index >= this.state.phrase.length) {
        if (this.isCorrect()) {
          if (!this.nextLevel()) {
            return "end of game";
          }
        }
        this.state.index = 0;
      }
    }
    this.state.cancelling = false;
    let [i, options] = this.currentOptions(this.state);
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
    let current = this.currentOptions(this.state);
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
    this.state.cancelling = true;
  }

  toUiValues(): UiValues {
    if (this.state === undefined) {
      return "end of game";
    }
    const result: UiValues = [];
    for (const [i, [index, options]] of Array.from(
      this.state.phrase.entries()
    )) {
      const snippet = options[index];
      if (snippet === undefined) {
        throw "fixme";
      }
      result.push({ snippet, focused: i === this.state.index });
    }
    return result;
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

export type UiValues =
  | Array<{ snippet: string; focused: boolean }>
  | "end of game";
