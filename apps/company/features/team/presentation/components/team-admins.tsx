import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate } from "@/app/i18n/interpolate";
import { initials } from "@/features/orders/domain/client-name";
import type { Admin } from "../../domain/types";
import { describeAccess, type TeamText } from "../team-text";

type Props = { lang: Locale; t: TeamText; admins: Admin[]; today: string };

/** Administradores de la empresa: ven precios y márgenes. Solo lectura. */
export function TeamAdmins({ lang, t, admins, today }: Props) {
  const a = t.admins;

  return (
    <section aria-labelledby="team-admins" className="flex flex-col gap-3 rounded-3xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="team-admins" className="text-base font-bold">
          {interpolate(a.title, { count: admins.length })}
        </h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <Icon name="lock" size={14} strokeWidth={2.2} />
          {a.hint}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2.5">
        {admins.map((admin) => (
          <li key={admin.id} className="flex items-center gap-3 rounded-2xl bg-surface-soft p-3">
            <span
              aria-hidden
              className={`grid size-10 flex-none place-items-center rounded-full text-sm font-bold ${admin.you ? "bg-primary text-primary-foreground" : "bg-foreground text-background"}`}
            >
              {initials(admin.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[15px] font-bold">
                {admin.name}
                {admin.you ? (
                  <span className="inline-flex h-5 items-center rounded-full bg-foreground px-2 text-[11px] text-background">{a.you}</span>
                ) : null}
              </span>
              <span className="truncate text-xs text-muted">
                {admin.email} ·{" "}
                {admin.you ? a.sessionNow : interpolate(a.lastAccess, { when: describeAccess(admin.lastAccess, t, lang, today) })}
              </span>
            </span>
            {/* Sin flujo de cambio de papel todavía */}
            {admin.you ? null : (
              <span title={t.soon} className="cursor-not-allowed text-[13px] font-bold opacity-50">
                {a.changeRole}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
