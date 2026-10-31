import Link from "next/link";

import type { Locale } from "@/app/i18n/config";
import { lacksPhone, stateOf } from "../../domain/team";
import type { Person } from "../../domain/types";
import { teamHref, type TeamParams } from "../team-href";
import { describeInactive, describeLastWork, describeNextWork, describeRole, describeStatus, type TeamText } from "../team-text";
import { IssueBadge, PersonAvatar, StatusPill, focusRing } from "./team-parts";

type Props = {
  lang: Locale;
  t: TeamText;
  /** Activos, convites y después inactivos. */
  people: Person[];
  selectedId: string | undefined;
  params: Omit<TeamParams, "person">;
  today: string;
  emptyMessage: string;
};

export function TeamCards({ lang, t, people, selectedId, params, today, emptyMessage }: Props) {
  if (people.length === 0) {
    return <p className="rounded-3xl border border-line bg-surface px-3 py-8 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
      {people.map((person) => {
        const selected = person.id === selectedId;
        const state = stateOf(person);
        const status = describeStatus(person, t, today);
        const member = person.kind === "member" ? person : null;
        const inactive = member && !member.active ? describeInactive(member, t) : null;
        const last = member ? describeLastWork(member, t, lang, today) : null;
        const next = member ? describeNextWork(member, t, today) : null;

        return (
          <li
            key={person.id}
            className={`relative flex h-full flex-col gap-2.5 rounded-[20px] p-4.5 transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(27,31,59,0.10)] ${
              state === "inactive" ? "bg-surface-soft" : "bg-surface"
            } ${
              selected
                ? "border-2 border-foreground shadow-[0_0_0_4px_var(--status-config-surface)]"
                : state === "invite"
                  ? "border border-dashed border-field-border"
                  : "border border-line"
            }`}
          >
            <span className="flex items-center gap-3">
              <PersonAvatar person={person} size={44} />
              <span className="flex min-w-0 flex-col">
                {/* Enlace estirado: toda la tarjeta abre el panel */}
                <Link
                  href={teamHref(lang, { ...params, person: person.id })}
                  scroll={false}
                  className={`text-[15px] font-bold after:absolute after:inset-0 after:rounded-[20px] ${focusRing}`}
                >
                  {person.name}
                </Link>
                <span className="truncate text-xs text-muted">{describeRole(person, t)}</span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1.5">
              <StatusPill state={state} label={inactive ? inactive.reason : status.label} />
              {member && lacksPhone(member) ? <IssueBadge>{t.phoneMissing}</IssueBadge> : null}
            </span>
            <span className="text-xs text-muted">{status.note}</span>
            <span className="grid grid-cols-2 gap-2 text-xs text-muted">
              <span className="flex flex-col">
                {t.cards.lastWork}
                <strong className="text-[13px] text-foreground">{last ? (last.sub ? `${last.title} · ${last.sub}` : last.title) : "—"}</strong>
              </span>
              <span className="flex flex-col">
                {t.cards.next}
                <strong className="text-[13px] text-foreground">{next ? next.title : "—"}</strong>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
