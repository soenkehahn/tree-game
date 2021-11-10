import * as React from "react";
import { UiValues } from "./storyGraph";
import { CSSProperties } from "react";
import Up from "./svgs/Up";
import Down from "./svgs/Down";

export function Scene({ phrase }: { phrase: UiValues }) {
  if (phrase === "end of game") {
    return <div>The End</div>;
  }
  return (
    <div style={sceneStyle}>
      {phrase.map((options, i) => (
        <Options {...options} key={i} />
      ))}
    </div>
  );
}

function Options({ snippet, focused }: { snippet: string; focused: boolean }) {
  return (
    <div style={optionsStyle}>
      <div style={chevronStyle}>{focused ? <Up /> : null}</div>
      <div style={boxStyle(focused)}>
        <div style={textStyle}>{snippet}</div>
      </div>
      <div style={chevronStyle}>{focused ? <Down /> : null}</div>
    </div>
  );
}

const sceneStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "1rem",
  margin: "2rem",
};

const optionsStyle: CSSProperties = {
  flex: "1 1 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "1em",
};

const chevronStyle: CSSProperties = {
  margin: "auto",
};

const boxStyle = (focused: boolean): CSSProperties => ({
  border: `0.3rem solid ${focused ? "black" : "#bbb"}`,
  borderRadius: "1rem",
  padding: "0.5rem",
  height: "5em",
  display: "flex",
});

const textStyle: CSSProperties = {
  fontFamily: "sans-serif",
  margin: "auto",
};
