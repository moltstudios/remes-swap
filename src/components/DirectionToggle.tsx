"use client";

type Props = {
  reversed: boolean;
  onToggle: () => void;
  ariaLabel: string;
};

export function DirectionToggle({ reversed, onToggle, ariaLabel }: Props) {
  return (
    <div className="flex justify-center -my-2xs relative z-10">
      <button
        onClick={onToggle}
        aria-label={ariaLabel}
        type="button"
        className="w-10 h-10 rounded-full bg-bg border border-ink/10 shadow-card flex items-center justify-center hover:bg-surface transition-all duration-200 active:scale-95 focus-visible:shadow-focus focus-visible:outline-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 text-ink transition-transform duration-200"
          style={{ transform: reversed ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          <path d="M7 4v16M7 20l-3-3M7 20l3-3" />
          <path d="M17 4v16M17 4l-3 3M17 4l3 3" />
        </svg>
      </button>
    </div>
  );
}