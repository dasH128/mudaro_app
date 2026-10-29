import { DEFAULT_LINK_VALIDITY_DAYS } from "@/features/orders/domain/types";
import type { FormValues } from "@/features/orders/application/schemas/new-order";

/** Valores con los que arranca el formulario. Teléfono primero: es lo que se pregunta al descolgar. */
export const DEFAULT_VALUES: FormValues = {
  phone: "",
  name: "",
  clientType: "private",
  email: "",
  taxId: "",
  clientId: "",
  origin: "",
  destination: "",
  stops: [],
  date: "",
  flexibility: "two-days",
  source: "phone",
  inventoryMode: "link",
  linkValidityDays: String(DEFAULT_LINK_VALIDITY_DAYS),
};
