"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

type ThemeToggleProps = {
  labels: { label: string; light: string; dark: string; system: string };
};

const subscribe = () => () => {};

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

export function ThemeToggle({ labels }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // false en servidor y en la hidratación, true después: evita marcar una opción antes de conocer el tema
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div role="group" aria-label={labels.label} className="flex items-center gap-1">
      {(["light", "dark", "system"] as const).map((option) => {
        const active = mounted && theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-pressed={active}
            aria-label={labels[option]}
            title={labels[option]}
            className={`grid size-8 place-items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {ICONS[option]}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
