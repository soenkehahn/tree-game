import * as React from "react";
import { Phrase } from "./storyGraph";

export function Scene({ phrase }: { phrase: Phrase }) {
  return (
    <div>
      {phrase.map((options, i) => (
        <Options {...options} key={i} />
      ))}
    </div>
  );
}

function Options({ snippet, focused }: { snippet: string; focused: boolean }) {
  return <div>{focused ? `[${snippet}]` : ` ${snippet} `} </div>;
}
