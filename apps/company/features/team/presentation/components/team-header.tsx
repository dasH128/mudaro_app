import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { pluralize } from "@/app/i18n/interpolate";
import type { TeamSummary } from "../../domain/team";
import type { TeamText } from "../team-text";
import { TeamHelp } from "./team-help";
import { focusRing } from "./team-parts";

type Props = { lang: Locale; t: TeamText; summary: TeamSummary };

const chip =
  "inline-flex h-8.5 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px]";

export function TeamHeader({ lang, t, summary }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">{t.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TeamHelp
            count={String(summary.active)}
            suffix={pluralize(lang, summary.active, t.summary.active)}
            help={t.help}
          />
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <strong>{summary.busy}</strong> {t.summary.busy}
          </span>
          <span className={chip}>
            <span aria-hidden className="size-2 rounded-full bg-success-dot" />
            <strong>{summary.free}</strong> {t.summary.free}
          </span>
          <span className={chip}>
            <span aria-hidden className="box-border size-2 rounded-full border-2 border-foreground" />
            <strong>{summary.invites}</strong> {pluralize(lang, summary.invites, t.summary.invites)}
          </span>
        </div>
      </div>
      {/* Sin diseño de flujo para convidar: queda desactivado */}
      <button
        type="button"
        disabled
        title={t.soon}
        className={`flex h-12 cursor-not-allowed items-center gap-2.5 rounded-full bg-primary px-5.5 text-base font-bold text-primary-foreground opacity-50 shadow-md ${focusRing}`}
      >
        <Icon name="userPlus" size={18} strokeWidth={2.4} />
        {t.invite}
      </button>
    </header>
  );
}
