"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { totalsOf } from "@mudaro/quotes";
import { Field, Icon, describedBy, inputClass } from "@mudaro/ui";
import { formatCompact, formatDate, formatEuro } from "@mudaro/validation";

import { interpolate } from "@/app/i18n/interpolate";
import { acceptQuoteAction, rejectQuoteAction } from "@/features/order/application/actions/quote";
import type { ClientOrder, ClientQuote } from "@/features/order/domain/types";
import type { ClientText } from "../inventory-text";
import { SignaturePad, type SignatureHandle } from "./signature-pad";

type Props = {
  t: ClientText;
  token: string;
  order: ClientOrder;
  quote: ClientQuote;
};

type ErrorCode = keyof ClientText["quote"]["errors"];

const card = "flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-surface p-6 print:border-0 print:p-0";
const heading = "font-display text-2xl font-extrabold";

// RF-41 a RF-45: el cliente ve el orçamento enviado, elige los opcionales con el total al momento (decisión 1),
// lo acepta con nombre y firma o lo rechaza. Se puede imprimir o guardar en PDF desde el navegador (P4).
export function QuoteView({ t, token, order, quote }: Props) {
  const q = t.quote;
  const router = useRouter();
  const open = quote.status === "sent" && !quote.expired;
  const chosenBefore = quote.acceptance?.selectedLineIds ?? [];

  const [selected, setSelected] = useState<readonly string[]>(chosenBefore);
  const [signerName, setSignerName] = useState(order.contactName);
  const signatureRef = useRef<SignatureHandle>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = quote.acceptance
    ? { subtotalCents: quote.acceptance.subtotalCents, vatCents: quote.acceptance.vatCents, totalCents: quote.acceptance.totalCents }
    : totalsOf(
        quote.lines.map((line) => ({ totalCents: line.totalCents, optional: line.optional, selected: selected.includes(line.id) })),
        quote.vatPct,
      );
  const values = { company: order.companyName };

  const accept = () =>
    startTransition(async () => {
      setError(null);
      const result = await acceptQuoteAction({
        token,
        quoteId: quote.id,
        documentHash: quote.documentHash,
        selectedLineIds: selected,
        signerName,
        signature: signatureRef.current?.toPng() ?? "",
      });
      if (result.ok) router.refresh();
      else setError(result.error in q.errors ? (result.error as ErrorCode) : "failed");
    });

  const reject = () =>
    startTransition(async () => {
      setError(null);
      const result = await rejectQuoteAction({ token, quoteId: quote.id, reason });
      if (result.ok) router.refresh();
      else setError(result.error in q.errors ? (result.error as ErrorCode) : "failed");
    });

  const status =
    quote.status === "accepted" && quote.acceptance
      ? {
          icon: "check" as const,
          tone: "border-success-border bg-success-surface",
          title: q.accepted.title,
          text: interpolate(q.accepted.text, {
            ...values,
            date: formatDate(quote.acceptance.acceptedAt),
            name: quote.acceptance.signerName,
            amount: formatEuro(quote.acceptance.totalCents),
          }),
        }
      : quote.status === "rejected"
        ? { icon: "close" as const, tone: "border-line bg-line-soft", title: q.rejected.title, text: interpolate(q.rejected.text, values) }
        : quote.status === "superseded"
          ? { icon: "clock" as const, tone: "border-line bg-warn-surface", title: q.superseded.title, text: interpolate(q.superseded.text, values) }
          : quote.expired && quote.validUntil
            ? { icon: "clock" as const, tone: "border-line bg-warn-surface", title: q.expired.title, text: interpolate(q.expired.text, { ...values, date: formatDate(quote.validUntil) }) }
            : null;

  return (
    <div className="flex flex-col gap-5">
      {status ? (
        <section role="status" className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${status.tone}`}>
          <Icon name={status.icon} size={22} className="mt-0.5 flex-none" />
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold">{status.title}</h2>
            <p className="text-[15px]">{status.text}</p>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="quote-title" className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
              {interpolate(q.eyebrow, { number: String(quote.number).padStart(4, "0"), version: quote.version })}
            </span>
            <h2 id="quote-title" className={heading}>
              {order.companyName}
            </h2>
            {quote.validUntil ? <span className="text-sm font-bold">{interpolate(q.validUntil, { date: formatDate(quote.validUntil) })}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-field-border px-4 text-sm font-bold print:hidden"
          >
            <Icon name="quotes" size={16} />
            {q.print}
          </button>
        </div>
        {open ? <p className="text-[15px] text-muted print:hidden">{interpolate(q.intro, values)}</p> : null}

        <table className="w-full border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 font-bold">{q.description}</th>
              <th className="py-2 text-right font-bold">{q.quantity}</th>
              <th className="py-2 text-right font-bold">{q.amount}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((line) => {
              const chosen = !line.optional || selected.includes(line.id);
              return (
                <tr key={line.id} className={`border-b border-line-soft ${line.optional && !chosen ? "text-muted" : ""}`}>
                  <td className="py-2.5 pr-3">
                    {line.optional ? (
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={chosen}
                          disabled={!open}
                          onChange={(event) =>
                            setSelected((current) => (event.target.checked ? [...current, line.id] : current.filter((id) => id !== line.id)))
                          }
                          className="size-5 accent-[var(--primary)]"
                        />
                        <span>
                          {line.description}{" "}
                          <span className="rounded-full bg-surface-head px-2 py-0.5 text-xs font-bold">{q.optional}</span>
                        </span>
                      </label>
                    ) : (
                      line.description
                    )}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {formatCompact(line.quantity)}
                    {line.unit ? ` ${line.unit}` : ""}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">{formatEuro(line.totalCents)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-3 text-right text-muted">
                {q.subtotal}
              </td>
              <td className="pt-3 text-right">{formatEuro(totals.subtotalCents)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="text-right text-muted">
                {interpolate(q.vat, { pct: `${formatCompact(quote.vatPct)} %` })}
              </td>
              <td className="text-right">{formatEuro(totals.vatCents)}</td>
            </tr>
            <tr>
              <td colSpan={2} className="pt-1 text-right text-lg font-bold">
                {q.total}
              </td>
              <td className="pt-1 text-right font-display text-2xl font-extrabold whitespace-nowrap">{formatEuro(totals.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
        {open && quote.lines.some((line) => line.optional) ? <p className="text-[13px] text-muted print:hidden">{q.optionalHint}</p> : null}

        {quote.pricingMode === "hourly" && quote.hourlyRateCents !== null ? (
          <p className="rounded-xl bg-surface-head px-4 py-3 text-sm">
            {interpolate(q.hourly, {
              amount: formatEuro(quote.hourlyRateCents),
              count: quote.operatorCount ?? 0,
              hours: formatCompact(quote.estimatedHours ?? 0),
            })}
          </p>
        ) : null}

        {quote.conditions ? (
          <div className="flex flex-col gap-1">
            <h3 className="text-[15px] font-bold">{q.conditions}</h3>
            <p className="text-[15px] whitespace-pre-line">{quote.conditions}</p>
          </div>
        ) : null}

        <details className="rounded-xl border border-line-soft px-4 py-3">
          <summary className="cursor-pointer text-[15px] font-bold">{interpolate(q.inventory, { version: quote.inventory.version })}</summary>
          <p className="mt-2 text-[13px] text-muted">{q.inventoryHint}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {quote.inventory.lines.map((line, index) => (
              <li key={index}>
                {line.quantity}× {line.name}
                {line.room ? <span className="text-muted"> · {line.room}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {open ? (
        rejecting ? (
          <section aria-labelledby="reject-title" className={`${card} print:hidden`}>
            <h2 id="reject-title" className={heading}>
              {q.reject.title}
            </h2>
            <Field id="reject-reason" label={q.reject.reason}>
              <textarea
                id="reject-reason"
                rows={3}
                maxLength={500}
                value={reason}
                placeholder={q.reject.reasonPlaceholder}
                onChange={(event) => setReason(event.target.value)}
                className="resize-y rounded-xl border border-field-border bg-surface px-3.5 py-3 text-base text-foreground outline-none placeholder:text-field-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </Field>
            {error ? (
              <p role="alert" className="text-sm font-bold text-danger-foreground">
                {q.errors[error]}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={pending} onClick={reject} className="h-12 rounded-full bg-foreground px-5 text-base font-bold text-background disabled:opacity-60">
                {pending ? q.reject.submitting : q.reject.submit}
              </button>
              <button type="button" disabled={pending} onClick={() => setRejecting(false)} className="h-12 px-3 text-sm font-bold underline">
                {q.reject.cancel}
              </button>
            </div>
          </section>
        ) : (
          <section aria-labelledby="accept-title" className={`${card} print:hidden`}>
            <h2 id="accept-title" className={heading}>
              {q.accept.title}
            </h2>
            <Field id="signer-name" label={q.accept.name}>
              <input
                id="signer-name"
                value={signerName}
                maxLength={200}
                autoComplete="name"
                onChange={(event) => setSignerName(event.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{q.accept.signature}</span>
              <span id="signature-hint" className="text-xs text-muted">
                {q.accept.signatureHint}
              </span>
              <SignaturePad label={q.accept.signature} describedBy={describedBy("signature", { hint: true })} clearLabel={q.accept.clear} handle={signatureRef} />
            </div>
            <p className="text-[13px] text-muted">{interpolate(q.accept.legal, { amount: formatEuro(totals.totalCents) })}</p>
            {error ? (
              <p role="alert" className="text-sm font-bold text-danger-foreground">
                {q.errors[error]}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={accept}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-70"
              >
                <Icon name="check" size={18} strokeWidth={2.4} />
                {pending ? q.accept.submitting : q.accept.submit}
              </button>
              <button type="button" disabled={pending} onClick={() => setRejecting(true)} className="h-12 px-3 text-sm font-bold underline">
                {q.reject.open}
              </button>
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
