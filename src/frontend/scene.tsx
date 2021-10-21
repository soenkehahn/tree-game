import * as React from "react";
import { Phrase } from "./storyGraph";
import { CSSProperties } from "react";

export function Scene({ phrase }: { phrase: Phrase }) {
  return (
    <div style={containerStyle}>
      {phrase.map((options, i) => (
        <Options {...options} key={i} />
      ))}
    </div>
  );
}

function Options({ snippet, focused }: { snippet: string; focused: boolean }) {
  return (
    <div style={itemStyle(focused)}>
      <div style={textStyle}>{snippet}</div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "1rem",
  margin: "2rem",
};

const itemStyle = (focused: boolean): CSSProperties => ({
  flex: "1 1 0",
  border: `0.3rem solid ${focused ? "black" : "#bbb"}`,
  borderRadius: "1rem",
  display: "flex",
  flexDirection: "column",
  padding: "0.5rem",
});

const textStyle: CSSProperties = {
  fontFamily: "sans-serif",
  margin: "auto",
};
