"use client";

import { useI18n } from "@/lib/i18n";

/**
 * TrustBar — ABOVE the input per brief: regulator / audit / reserve backing.
 * Three pills in a row. Quiet but always present.
 */
export function TrustBar() {
  const { t } = useI18n();
  return (
    <div
      className="grid grid-cols-3 gap-xs"
      role="region"
      aria-label="Señales de confianza"
    >
      <Pill icon={<ShieldIcon />}>
        <span className="block">{t.trust.regulated.split(" ")[0]}</span>
        <span className="block">CNAD ES</span>
      </Pill>
      <Pill icon={<CheckIcon />}>
        <span className="block">Auditado</span>
        <span className="block">mensual</span>
      </Pill>
      <Pill icon={<ReserveIcon />}>
        <span className="block">Reservas</span>
        <span className="block">1:1</span>
      </Pill>
    </div>
  );
}

function Pill({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-xs py-sm rounded-md bg-surface">
      <span className="text-primary" aria-hidden="true">{icon}</span>
      <span className="text-[10px] leading-tight font-medium text-ink/70 text-center">
        {children}
      </span>
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