/**
 * Remes monogram — "Re" on deep blue square.
 */
type Props = { className?: string };
export function Logo({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#0A4D8C" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="#FFFFFF"
        letterSpacing="-0.5"
      >
        Re
      </text>
    </svg>
  );
}