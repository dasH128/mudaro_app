import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { CopyButton } from "@/app/components/copy-button";
import { LockedBoxArt, MobileAppArt, RevokedBadgeArt, UnknownBoxArt } from "@/app/components/error-art";
import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { SUPPORT_EMAIL } from "@/app/lib/contact";
import { ROUTES, localePath } from "@/app/lib/routes";
import { signOutAction } from "@/features/auth/application/actions/sign-out";
import { blockedReasonOf, type BlockedReason } from "@/features/auth/domain/session";
import { getCompanySession } from "@/features/auth/infrastructure/session.repo";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.auth.noAccess.eyebrow };
}

const ART: Record<BlockedReason, ReactNode> = {
  company: <LockedBoxArt />,
  account: <RevokedBadgeArt />,
  role: <MobileAppArt />,
  none: <UnknownBoxArt />,
};

/** Motivos que resuelve el equipo Mudaro: llevan el email de soporte. Los otros los resuelve alguien de la empresa. */
const CONTACT_MUDARO: ReadonlySet<BlockedReason> = new Set(["company", "none"]);

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// La sesión es un dato de la petición: se lee dentro de Suspense (Cache Components).
// El motivo se calcula aquí, en servidor, con la sesión real: no viaja en la URL, así que no se puede falsear.
async function NoAccess() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const current = await getCompanySession();
  if (current.status === "anonymous") redirect(localePath(locale, ROUTES.auth.login));
  const reason = blockedReasonOf(current);
  // Quien sí tiene acceso no pinta nada aquí
  if (!reason) redirect(localePath(locale, ROUTES.home));

  const t = (await getDictionary()).auth.noAccess;

  return (
    <section className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center sm:p-10">
      {ART[reason]}
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">{t.eyebrow}</p>
      <h1 className="font-display text-3xl leading-[1.1] font-extrabold tracking-tight text-balance">{t[reason].title}</h1>
      <p className="leading-relaxed text-muted">{t[reason].text}</p>

      {CONTACT_MUDARO.has(reason) ? (
        <div className="mt-2 flex w-full flex-col items-center gap-2.5 rounded-xl bg-surface-head px-4 py-4">
          <p className="text-sm text-muted">{t.contact}</p>
          <p className="font-bold select-all">{SUPPORT_EMAIL}</p>
          <CopyButton text={SUPPORT_EMAIL} label={t.copy} copiedLabel={t.copied} />
        </div>
      ) : null}

      <form action={signOutAction} className="mt-3">
        <input type="hidden" name="lang" value={locale} />
        <button
          type="submit"
          className={`inline-flex h-11 cursor-pointer items-center rounded-full border border-field-border bg-surface px-5 text-[15px] font-bold text-foreground ${focusRing}`}
        >
          {t.signOut}
        </button>
      </form>
    </section>
  );
}

/** Acceso bloqueado: fuera del panel (sin menú), porque esta persona no tiene nada que hacer dentro. */
export default function NoAccessPage() {
  return (
    <Suspense>
      <NoAccess />
    </Suspense>
  );
}
