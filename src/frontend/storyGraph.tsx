export type Phrase = Array<{ snippet: string; focused: boolean }>;

export class StoryGraph {
  phrase: Array<[number, Array<string>]> = [];
  index: number = -1;

  constructor(phrase: Array<Array<string>>) {
    for (let options of phrase) {
      let stateOptions = [];
      for (let option of options) {
        stateOptions.push(option);
      }
      this.phrase.push([0, stateOptions]);
    }
  }

  currentOptions(): [number, Array<string>] {
    let options = this.phrase[this.index];
    if (options === undefined) {
      throw "fixme";
    }
    return options;
  }

  currentPhrase(): Phrase {
    const result: Phrase = [];
    this.phrase.forEach(([index, options], i) => {
      const snippet = options[index];
      if (snippet === undefined) {
        throw "fixme";
      }
      result.push({ snippet, focused: i === this.index });
    });
    return result;
  }

  nextSnippet(): string | undefined {
    let new_current = this.index + 1;
    if (new_current >= this.phrase.length) {
      new_current = 0;
    }
    this.index = new_current;
    let options = this.currentOptions();
    return options[1][options[0]];
  }

  handleInput(key: string) {
    let current = this.currentOptions();
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
  }

  debug(): string {
    let result = "";
    this.phrase.forEach((options, index) => {
      let option = options[1][options[0]];
      if (index === this.index) {
        result += `[${option}] `;
      } else {
        result += ` ${option}  `;
      }
    });
    return result.trimEnd();
  }
}
