import { FirstUse } from "@/app/components/first-use";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { FleetText } from "../fleet-text";
import { FleetEmptyArt, PerkIcon } from "./fleet-empty-art";

type Props = { lang: Locale; t: FleetText };

const PERKS = ["capacity", "costs", "schedule"] as const;
/** Pasos del asistente de configuración de la empresa y el que toca (provisional: el asistente aún no existe). */
const SETUP_STEPS = 4;
const SETUP_CURRENT = 3;

/** Primer uso (P7-1): la empresa aún no tiene ningún vehículo. */
export function FleetEmpty({ lang, t }: Props) {
  const e = t.empty;

  return (
    <FirstUse
      header={{ eyebrow: t.eyebrow, title: t.title, icon: "truck", count: e.count }}
      hero={{
        eyebrow: e.eyebrow,
        title: e.title,
        text: e.text,
        cta: e.cta,
        ctaIcon: "plus",
        ctaHref: localePath(lang, ROUTES.fleet.new),
        hint: e.hint,
        soon: t.soon,
        art: <FleetEmptyArt />,
      }}
      perks={{
        title: e.perksTitle,
        items: PERKS.map((key) => ({ icon: <PerkIcon name={key} />, title: e.perks[key].title, text: e.perks[key].text })),
      }}
      footer={{
        note: e.later,
        // El asistente de configuración no existe todavía: se muestra el avance sin enlace
        aside: (
          <span
            title={t.soon}
            className="inline-flex h-10 cursor-not-allowed items-center gap-2.5 rounded-full border border-line bg-surface pr-3 pl-3.5 text-[13px] opacity-70"
          >
            <span className="text-muted">{e.setup.label}</span>
            <span aria-hidden className="inline-flex gap-0.75">
              {Array.from({ length: SETUP_STEPS }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.25 w-3.5 rounded-full ${index < SETUP_CURRENT - 1 ? "bg-foreground" : index === SETUP_CURRENT - 1 ? "bg-primary" : "bg-line"}`}
                />
              ))}
            </span>
            <strong>{e.setup.step.replace("{current}", String(SETUP_CURRENT)).replace("{total}", String(SETUP_STEPS))}</strong>
          </span>
        ),
      }}
    />
  );
}
