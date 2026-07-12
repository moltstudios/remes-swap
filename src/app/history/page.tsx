"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { useAccount } from "wagmi";

export default function HistoryPage() {
  const t = useTranslations();
  const { address, isConnected } = useAccount();

  return (
    <section className="px-4 pt-6 pb-12">
      <div className="max-w-content mx-auto">
        <h1 className="text-heading text-ink-900 mb-4">{t.history.title}</h1>

        <div className="card p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-ink-100 text-ink-600 flex items-center justify-center mb-4">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2" />
            </svg>
          </div>
          <h2 className="text-subheading text-ink-900 mb-1">
            {t.history.empty}
          </h2>
          <p className="text-small text-ink-500">{t.history.emptyBody}</p>

          {isConnected && address && (
            <p className="text-micro text-ink-400 mt-4 font-mono break-all">
              {address}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}