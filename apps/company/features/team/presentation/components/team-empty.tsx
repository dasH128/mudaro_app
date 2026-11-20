import { FirstUse } from "@/app/components/first-use";
import type { Locale } from "@/app/i18n/config";
import { ROUTES, localePath } from "@/app/lib/routes";
import { initials } from "@/features/orders/domain/client-name";
import type { Admin } from "../../domain/types";
import type { TeamText } from "../team-text";
import { PerkIcon, TeamEmptyArt } from "./team-empty-art";

type Props = { lang: Locale; t: TeamText; admin: Admin | undefined };

const PERKS = ["phone", "photos", "prices"] as const;

/** Primer uso (P8-1): la empresa aún no tiene a nadie en el equipo. */
export function TeamEmpty({ lang, t, admin }: Props) {
  const e = t.empty;

  return (
    <FirstUse
      header={{ eyebrow: t.eyebrow, title: t.title, icon: "team", count: e.count }}
      hero={{
        eyebrow: e.eyebrow,
        title: e.title,
        text: e.text,
        cta: e.cta,
        ctaIcon: "userPlus",
        ctaHref: localePath(lang, ROUTES.team.new),
        hint: e.hint,
        soon: t.soon,
        art: <TeamEmptyArt />,
      }}
      perks={{
        title: e.perksTitle,
        items: PERKS.map((key) => ({ icon: <PerkIcon name={key} />, title: e.perks[key].title, text: e.perks[key].text })),
      }}
      footer={{
        note: e.solo,
        aside: admin ? (
          <span className="inline-flex h-11 items-center gap-2.5 rounded-full border border-line bg-surface pr-4 pl-1.5 text-[13px]">
            <span aria-hidden className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials(admin.name)}
            </span>
            <span>
              <strong>{admin.name}</strong> <span className="text-muted">· {e.you}</span>
            </span>
          </span>
        ) : null,
      }}
    />
  );
}
