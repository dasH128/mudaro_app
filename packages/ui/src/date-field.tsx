"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "./icon";

type Labels = {
  /** Nombre accesible del botón que abre el calendario. */
  open: string;
  previousMonth: string;
  nextMonth: string;
  today: string;
};

const LABELS_PT: Labels = {
  open: "Abrir calendário",
  previousMonth: "Mês anterior",
  nextMonth: "Mês seguinte",
  today: "Hoje",
};

type DateFieldConfig = {
  /** Idioma de los meses y los días de la semana (p. ej. "pt-PT"). */
  locale: string;
  /** Texto del campo vacío. */
  placeholder: string;
  labels: Labels;
};

const DEFAULT_CONFIG: DateFieldConfig = { locale: "pt-PT", placeholder: "dd/mm/aaaa", labels: LABELS_PT };

const DateFieldContext = createContext<DateFieldConfig>(DEFAULT_CONFIG);

/** Fija el idioma de todos los `DateField` de dentro. Sin él, portugués de Portugal. */
export function DateFieldProvider({ value, children }: { value: DateFieldConfig; children: ReactNode }) {
  return <DateFieldContext.Provider value={value}>{children}</DateFieldContext.Provider>;
}

type Props = {
  /** Nombre del campo en el formulario. El valor se envía como dd/mm/aaaa (RNF-10). */
  name?: string;
  id?: string;
  /** Valor inicial en dd/mm/aaaa. */
  defaultValue?: string;
  placeholder?: string;
  /** Idioma de los meses y los días de la semana. Por defecto, el del `DateFieldProvider`. */
  locale?: string;
  labels?: Partial<Labels>;
  /** Clases del campo de texto (el botón del calendario se coloca encima, a la derecha). */
  className?: string;
  onChange?: (value: string) => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type Day = { y: number; m: number; d: number };

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = ({ y, m, d }: Day) => `${y}-${pad(m + 1)}-${pad(d)}`;
const toPt = ({ y, m, d }: Day) => `${pad(d)}/${pad(m + 1)}/${y}`;
const sameDay = (a: Day | null, b: Day) => a !== null && a.y === b.y && a.m === b.m && a.d === b.d;

/** Suma días con Date en UTC, para que el horario de verano no mueva el día. */
function addDays(day: Day, amount: number): Day {
  const date = new Date(Date.UTC(day.y, day.m, day.d + amount));
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
}

/** Solo para dibujar el calendario: la validación real de la fecha la hace el servidor (parseDatePt). */
function fromPt(value: string): Day | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = { y: Number(yyyy), m: Number(mm) - 1, d: Number(dd) };
  const check = addDays(day, 0);
  return check.y === day.y && check.m === day.m && check.d === day.d ? day : null;
}

/** Campo de fecha en dd/mm/aaaa: se puede escribir o elegir en un calendario desplegable. */
export function DateField({
  name,
  id,
  defaultValue = "",
  placeholder,
  locale,
  labels,
  className,
  onChange,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: Props) {
  const config = useContext(DateFieldContext);
  const text = { ...config.labels, ...labels };
  placeholder ??= config.placeholder;
  locale ??= config.locale;
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  // Día con foco dentro de la rejilla (el mes visible sale de él).
  const [focused, setFocused] = useState<Day | null>(null);
  const [moveFocus, setMoveFocus] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Por defecto el desplegable se alinea con el borde izquierdo del campo; si no cabe, con el derecho.
  const [alignRight, setAlignRight] = useState(false);

  const selected = fromPt(value);
  const today = (() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
  })();

  const change = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) rootRef.current?.querySelector<HTMLButtonElement>("[data-open-button]")?.focus();
  };

  const openCalendar = () => {
    setFocused(selected ?? today);
    setMoveFocus(false);
    setOpen(true);
  };

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    setAlignRight(false);
    const box = popoverRef.current?.getBoundingClientRect();
    if (box && box.right > window.innerWidth - 8) setAlignRight(true);
  }, [open]);

  // Con el teclado, el foco sigue al día activo.
  useEffect(() => {
    if (!open || !moveFocus || !focused) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toIso(focused)}"]`)?.focus();
  }, [open, moveFocus, focused]);

  const view = focused ?? selected ?? today;
  const first = new Date(Date.UTC(view.y, view.m, 1));
  // Semana que empieza el lunes.
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (Day | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ y: view.y, m: view.m, d: index + 1 })),
  ];

  const rawMonth = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  // Solo la primera letra en mayúscula ("Novembro de 2026"), no cada palabra.
  const monthName = rawMonth.charAt(0).toLocaleUpperCase(locale) + rawMonth.slice(1);
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + index))),
  );

  const moveMonth = (amount: number) => {
    const target = new Date(Date.UTC(view.y, view.m + amount, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    setFocused({ y: target.getUTCFullYear(), m: target.getUTCMonth(), d: Math.min(view.d, lastDay) });
  };

  const pick = (day: Day) => {
    change(toPt(day));
    close(true);
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const step = steps[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setFocused(addDays(view, step));
      setMoveFocus(true);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveMonth(event.key === "PageUp" ? -1 : 1);
      setMoveFocus(true);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative min-w-0"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <input
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onChange={(event) => change(event.target.value)}
        className={`w-full ${className ?? ""}`}
        style={{ paddingRight: "2.75rem" }}
      />
      <button
        type="button"
        data-open-button
        aria-label={text.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => (open ? close(false) : openCalendar())}
        className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-xl text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="calendar" size={18} />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          id={popoverId}
          role="dialog"
          aria-label={monthName}
          className={`absolute ${alignRight ? "right-0" : "left-0"} z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-[20px] border border-line bg-surface p-3 text-foreground shadow-[0_16px_40px_rgba(27,31,59,0.12)]`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={text.previousMonth}
              onClick={() => moveMonth(-1)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="chevronLeft" size={18} />
            </button>
            <span aria-live="polite" className="text-sm font-bold">
              {monthName}
            </span>
            <button
              type="button"
              aria-label={text.nextMonth}
              onClick={() => moveMonth(1)}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Icon name="chevronRight" size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-bold uppercase text-muted" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday} className="min-w-0 py-1">
                {weekday.slice(0, 3)}
              </span>
            ))}
          </div>

          <div ref={gridRef} role="group" aria-label={monthName} onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;
              const isSelected = sameDay(selected, day);
              const isToday = sameDay(today, day);
              return (
                <button
                  key={day.d}
                  type="button"
                  data-day={toIso(day)}
                  tabIndex={sameDay(view, day) ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
                    new Date(Date.UTC(day.y, day.m, day.d)),
                  )}
                  onClick={() => pick(day)}
                  className={`mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-sm focus-visible:outline-2 focus-visible:outline-primary ${
                    isSelected
                      ? "bg-primary font-bold text-primary-foreground"
                      : isToday
                        ? "border border-primary font-bold hover:bg-surface-soft"
                        : "hover:bg-surface-soft"
                  }`}
                >
                  {day.d}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => pick(today)}
              className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-bold underline hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-primary"
            >
              {text.today}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
