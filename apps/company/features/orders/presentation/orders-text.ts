import type { Dictionary } from "@/app/i18n/get-dictionary";
import { interpolate } from "@/app/i18n/interpolate";

export type OrdersText = Dictionary["app"]["orders"];
export type NewOrderText = OrdersText["new"];
export type CreatedText = OrdersText["created"];

type MessageValues = { name: string; sender: string; company: string; link: string; days: number };

/** Mensaje al cliente, párrafo a párrafo. Se usa en la vista previa y en el texto que se envía. */
export function buildMessage(t: OrdersText["message"], values: MessageValues): string[] {
  return t.body.map((paragraph) => interpolate(paragraph, values));
}
