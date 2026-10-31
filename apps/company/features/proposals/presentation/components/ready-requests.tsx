import Link from "next/link";

import { Icon } from "@/app/components/app-icon";
import type { Locale } from "@/app/i18n/config";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { formatRelativeTime, formatVolume } from "@/app/lib/format";
import { ROUTES, localePath } from "@/app/lib/routes";
import type { ReadyRequest } from "@/features/proposals/domain/types";
import type { ProposalsText } from "../proposals-text";

type Props = { lang: Locale; t: ProposalsText; requests: readonly ReadyRequest[] };

export function ReadyRequests({ lang, t, requests }: Props) {
  if (requests.length === 0) return null;

  const { ready } = t;
  return (
    <section aria-labelledby="ready" className="flex gap-3.5 rounded-[20px] border border-warn-border bg-warn-surface px-4.5 py-4">
      <span aria-hidden className="grid size-10 flex-none place-items-center rounded-xl bg-warn-border/30 text-warn-foreground">
        <Icon name="proposals" size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1 text-sm leading-snug text-warn-foreground">
          <h2 id="ready" className="font-bold">
            {ready.title}
          </h2>
          <span>{ready.subtitle}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-warn-border bg-surface px-4 py-3.5"
            >
              <div className="flex min-w-50 flex-1 flex-col gap-0.5 text-sm">
                <span className="font-bold">
                  {request.id} · {request.client}
                </span>
                <span className="text-xs text-muted">
                  {request.from} <span aria-hidden="true">→</span>
                  <span className="sr-only">{t.list.routeTo}</span> {request.to} · {formatVolume(request.volumeM3)} ·{" "}
                  {request.missingMeasures > 0 ? (
                    <strong className="text-warn-foreground">
                      {pluralize(lang, request.missingMeasures, ready.missingMeasures)}
                    </strong>
                  ) : (
                    interpolate(ready.received, { time: formatRelativeTime(lang, request.receivedAt) })
                  )}
                </span>
              </div>
              <Link
                href={`${localePath(lang, ROUTES.proposals.new)}?${new URLSearchParams({ request: request.id })}`}
                className="whitespace-nowrap text-[13px] font-bold text-foreground underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {ready.create}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
