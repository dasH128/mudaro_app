"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

import { Icon } from "@/app/components/app-icon";
import { useDismiss } from "@/app/components/use-dismiss";

type ThemeToggleProps = {
  labels: { label: string; light: string; dark: string; system: string };
};

const subscribe = () => () => {};

const OPTIONS = ["light", "dark", "system"] as const;

const ICONS = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  dark: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  system: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
} as const;

function ThemeIcon({ name }: { name: (typeof OPTIONS)[number] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/** Botón con el tema actual que abre una lista para elegir claro, oscuro o sistema. */
export function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // false en servidor y en la hidratación, true después: evita marcar una opción antes de conocer el tema
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = mounted && theme && theme in ICONS ? (theme as (typeof OPTIONS)[number]) : "system";

  useDismiss(open, root, () => setOpen(false));

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${labels.label}: ${labels[selected]}`}
        className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ThemeIcon name={selected} />
        <Icon name="chevronDown" size={16} />
      </button>

      {open && (
        <ul
          aria-label={labels.label}
          className="absolute right-0 z-20 mt-2 min-w-40 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          {OPTIONS.map((option) => {
            const active = mounted && theme === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme(option);
                    setOpen(false);
                  }}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    active ? "bg-foreground/5 font-bold" : "font-medium hover:bg-foreground/5"
                  }`}
                >
                  <ThemeIcon name={option} />
                  <span className="flex-1">{labels[option]}</span>
                  {active && <Icon name="check" size={16} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
