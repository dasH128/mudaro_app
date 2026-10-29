import type { InventoryMode } from "@/features/orders/domain/types";
import { buildMessage, type NewOrderText, type OrdersText } from "../orders-text";

const card = "flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-6";

type MessageProps = {
  t: OrdersText;
  name: string;
  sender: string;
  company: string;
  days: number;
};

/** Cómo verá el cliente el mensaje. El enlace real aún no se genera: lleva una marca. */
export function MessagePreview({ t, name, sender, company, days }: MessageProps) {
  const paragraphs = buildMessage(t.message, {
    name: name || t.message.namePlaceholder,
    sender,
    company,
    link: t.message.linkPlaceholder,
    days,
  });
  const linkIndex = 2;

  return (
    <section aria-labelledby="message-preview" className={card}>
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="message-preview" className="font-display text-xl font-extrabold">
          {t.new.side.messageTitle}
        </h2>
        {/* TODO: editar la plantilla del mensaje (RF-16) aún no tiene diseño de flujo */}
        <button type="button" disabled className="text-[13px] font-bold underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60">
          {t.new.side.editTemplate}
        </button>
      </div>
      <div className="flex flex-col gap-2.5 rounded-2xl rounded-bl-[4px] bg-background p-4 text-sm leading-[1.55]">
        {paragraphs.map((paragraph, index) => (
          <span
            key={index}
            className={index === linkIndex ? "break-all font-bold underline" : index === paragraphs.length - 1 ? "text-muted" : undefined}
          >
            {paragraph}
          </span>
        ))}
      </div>
      <span className="text-xs text-muted">{t.new.side.messageFooter}</span>
    </section>
  );
}

/** Qué ocurre después de crear el pedido, según quién rellene el inventario. */
export function AfterSteps({ t, mode }: { t: NewOrderText; mode: InventoryMode }) {
  const steps = mode === "link" ? t.side.afterLink : t.side.afterSelf;

  return (
    <section aria-labelledby="after" className={card}>
      <h2 id="after" className="font-display text-xl font-extrabold">
        {t.side.afterTitle}
      </h2>
      <ol className="flex flex-col gap-3.5 text-sm">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden="true"
              className="grid size-6.5 flex-none place-items-center rounded-full border-2 border-foreground text-xs font-bold"
            >
              {index + 1}
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <strong>{step.title}</strong>
              <span className="text-muted">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
