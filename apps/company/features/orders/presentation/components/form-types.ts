import type { FormValues } from "@/features/orders/application/schemas/new-order";

/** Cambia un campo del formulario. */
export type SetValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
