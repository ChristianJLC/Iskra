import type { SVGProps } from "react";

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 24,
  height: 24,
};

export function ChestBicepsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M7 9c0-2.5 1.8-4 5-4s5 1.5 5 4v4c0 3-2 5-5 5s-5-2-5-5V9Z" />
      <path d="M12 5v6" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  );
}

export function BackTricepsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 6c0-1.5 1-3 2.5-3h9C18 3 19 4.5 19 6l-2.5 11c-.4 2-1.8 3-4.5 3s-4.1-1-4.5-3L5 6Z" />
      <path d="M12 5v13" />
    </svg>
  );
}

export function LegsAbsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps} {...props}>
      <g fill="currentColor" stroke="none">
        <rect x="9" y="2" width="2.4" height="2.4" rx="0.6" />
        <rect x="12.6" y="2" width="2.4" height="2.4" rx="0.6" />
        <rect x="9" y="5" width="2.4" height="2.4" rx="0.6" />
        <rect x="12.6" y="5" width="2.4" height="2.4" rx="0.6" />
        <rect x="9" y="8" width="2.4" height="2.4" rx="0.6" />
        <rect x="12.6" y="8" width="2.4" height="2.4" rx="0.6" />
      </g>
      <path d="M9.2 11.5h5.6" />
      <path d="M9.5 11.5v4.5c0 2.5-.8 4-1.7 6" />
      <path d="M14.5 11.5v4.5c0 2.5.8 4 1.7 6" />
    </svg>
  );
}
