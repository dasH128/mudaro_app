import type { Locale } from "@/app/i18n/config";
import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate, pluralize } from "@/app/i18n/interpolate";
import { dayLisbon, formatDate, formatTime } from "@/app/lib/format";
import type { Validity } from "@/features/proposals/domain/status";

export type ProposalsText = Dictionary["app"]["proposals"];

export type ValidityText = { title: string; note: string; warn: boolean };

/** Pasa el código de validez del dominio a los textos de la interfaz. */
export function describeValidity(validity: Validity, t: ProposalsText, locale: Locale, today: string): ValidityText {
  const v = t.validity;
  switch (validity.kind) {
    case "not-sent": {
      const isToday = dayLisbon(validity.createdAt) === today;
      const note = isToday
        ? interpolate(v.createdToday, { time: formatTime(validity.createdAt) })
        : interpolate(v.createdOn, { date: formatDate(validity.createdAt) });
      return { title: v.notSent, note, warn: false };
    }
    case "expires-today":
      return { title: v.expiresToday, note: interpolate(v.until, { date: formatDate(validity.validUntil) }), warn: true };
    case "expiring":
      return {
        title: pluralize(locale, validity.days, v.expiresIn),
        note: interpolate(v.until, { date: formatDate(validity.validUntil) }),
        warn: true,
      };
    case "valid":
      return { title: v.valid, note: interpolate(v.until, { date: formatDate(validity.validUntil) }), warn: false };
    case "accepted": {
      const isToday = dayLisbon(validity.at) === today;
      return {
        title: isToday ? v.acceptedToday : v.accepted,
        note: isToday
          ? interpolate(v.signedAt, { time: formatTime(validity.at) })
          : interpolate(v.signedOn, { date: formatDate(validity.at) }),
        warn: false,
      };
    }
    case "rejected":
      return {
        title: v.rejected,
        note: validity.reason ? interpolate(v.reason, { reason: validity.reason }) : v.noReason,
        warn: false,
      };
    case "expired":
      return { title: v.expired, note: interpolate(v.expiredOn, { date: formatDate(validity.on) }), warn: false };
    case "superseded":
      return { title: v.superseded, note: v.supersededNote, warn: false };
  }
}
