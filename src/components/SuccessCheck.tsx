/**
 * SuccessCheck — animated green ✓ for the Done screen.
 * Brief: "Green ✓ at top" — no confetti.
 */
export function SuccessCheck() {
  return (
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-tick-in"
      style={{ backgroundColor: "#D1FAE5" }}
      role="img"
      aria-label="Completado"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" fill="#10B981" />
        <path
          d="M14 24l7 7 14-14"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 100,
            strokeDashoffset: 0,
            animation: "drawCheck 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
    </div>
  );
}