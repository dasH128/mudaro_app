import Link from "next/link";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/app/components/app-icon";

type Props = {
  /** Cabecera de la página: la misma de la lista, con el contador a cero. */
  header: { eyebrow: string; title: string; icon: IconName; count: string };
  hero: {
    eyebrow: string;
    title: string;
    text: string;
    cta: string;
    ctaIcon: IconName;
    /** Destino del botón. Sin él, el botón sale desactivado. */
    ctaHref?: string;
    hint: string;
    /** Texto del botón mientras no tenga flujo ("Disponível em breve"). */
    soon: string;
    art: ReactNode;
  };
  perks: { title: string; items: { icon: ReactNode; title: string; text: string }[] };
  footer: { note: string; aside: ReactNode };
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Estado de primer uso de una lista (Frota, Equipa): invitación a crear el primer elemento y qué se gana con ello. */
export function FirstUse({ header, hero, perks, footer }: Props) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{header.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{header.title}</h1>
        </div>
        <span className="inline-flex h-10 items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-[15px] font-bold">
          <Icon name={header.icon} size={20} />
          {header.count}
        </span>
      </header>

      <section aria-labelledby="first-use-title" className="overflow-hidden rounded-[28px] border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-6 px-6 pt-10 pb-8 sm:px-12">
          <div className="flex flex-[1_1_380px] flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{hero.eyebrow}</span>
            <h2
              id="first-use-title"
              className="max-w-140 font-display text-4xl leading-[1.04] font-extrabold tracking-[-0.03em] sm:text-5xl"
            >
              {hero.title}
            </h2>
            <p className="max-w-130 text-lg leading-[1.55] text-muted">{hero.text}</p>
            <div className="mt-2 flex flex-col items-start gap-3">
              {hero.ctaHref ? (
                <Link
                  href={hero.ctaHref}
                  className={`inline-flex h-14 items-center gap-3 rounded-full bg-primary px-7.5 text-lg font-bold text-primary-foreground shadow-md ${focusRing}`}
                >
                  <Icon name={hero.ctaIcon} size={20} strokeWidth={2.5} />
                  {hero.cta}
                </Link>
              ) : (
                /* Sin diseño de flujo para el alta: queda desactivado */
                <button
                  type="button"
                  disabled
                  title={hero.soon}
                  className={`inline-flex h-14 cursor-not-allowed items-center gap-3 rounded-full bg-primary px-7.5 text-lg font-bold text-primary-foreground opacity-50 shadow-md ${focusRing}`}
                >
                  <Icon name={hero.ctaIcon} size={20} strokeWidth={2.5} />
                  {hero.cta}
                </button>
              )}
              <span className="text-sm text-muted">{hero.hint}</span>
            </div>
          </div>
          {hero.art}
        </div>

        <div className="mx-10 h-px bg-line-soft" />

        <div className="flex flex-col gap-5.5 px-6 pt-8 pb-10 sm:px-12">
          <h3 className="font-display text-[26px] font-extrabold tracking-[-0.01em]">{perks.title}</h3>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8 gap-y-6">
            {perks.items.map((perk) => (
              <li key={perk.title} className="flex items-start gap-4.5">
                {perk.icon}
                <span className="flex flex-col gap-1.5">
                  <strong className="font-display text-xl font-extrabold">{perk.title}</strong>
                  <span className="text-[15px] leading-normal text-muted">{perk.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-1">
        <span className="flex items-center gap-3 text-[15px] text-muted">
          <Icon name="info" size={24} className="flex-none text-foreground" />
          {footer.note}
        </span>
        {footer.aside}
      </div>
    </>
  );
}
