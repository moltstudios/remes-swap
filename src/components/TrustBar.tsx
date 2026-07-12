"use client";

import { useI18n } from "@/lib/i18n";

/**
 * TrustBar — 3 elevated cards in a row (per Timothy #9, Cash App pattern).
 * Subtle borders + shadow. Not inline pills.
 */
export function TrustBar() {
  const { t } = useI18n();
  const items = [
    { icon: <ShieldIcon />, label: "Regulado", sub: "CNAD ES" },
    { icon: <CheckIcon />, label: "Auditado", sub: "Mensual" },
    { icon: <ReserveIcon />, label: "Reservas", sub: "1:1" },
  ];
  return (
    <div
      className="grid grid-cols-3 gap-xs"
      role="region"
      aria-label="Señales de confianza"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="elevated-card flex flex-col items-center gap-xs px-xs py-sm"
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-primary bg-primary/5"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <div className="text-center">
            <p className="text-micro font-bold text-ink leading-tight">
              {item.label}
            </p>
            <p className="text-[10px] leading-tight text-ink/50 mt-0.5">
              {item.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ReserveIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 14h4M14 14h4" />
    </svg>
  );
}