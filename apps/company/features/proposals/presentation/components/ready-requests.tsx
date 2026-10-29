import Link from "next/link";

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
    <section
      aria-labelledby="ready"
      className="flex flex-col gap-3.5 rounded-2xl border border-warn-border bg-warn-surface px-6 py-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id="ready" className="font-display text-xl font-extrabold">
          {ready.title}
        </h2>
        <span className="text-sm text-warn-foreground">{ready.subtitle}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-warn-border bg-surface px-4 py-3.5"
          >
            <div className="flex min-w-50 flex-1 flex-col gap-0.5">
              <span className="font-bold">
                {request.id} · {request.client}
              </span>
              <span className="text-[13px] text-muted">
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
              className="inline-flex h-9 items-center whitespace-nowrap rounded-[10px] border border-field-border bg-surface px-3.5 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {ready.create}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
