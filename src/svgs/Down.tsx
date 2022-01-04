import * as React from "react";

function SvgDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={100}
      height={40}
      viewBox="0 0 26.458 10.583"
      {...props}
    >
      <path
        d="M.765.765L13.23 9.818 25.693.765"
        fill="none"
        stroke="#000"
        strokeWidth={1.531}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default SvgDown;
