import { initials } from "@/features/orders/domain/client-name";

const AVATARS = [
  "bg-foreground text-background",
  "bg-accent text-primary-foreground",
  "bg-status-config-surface text-foreground",
  "bg-warn-surface text-warn-foreground",
  "bg-success-surface text-success-foreground",
];

type Props = { name: string; index: number; size?: "md" | "sm" };

/** Iniciales del cliente sobre un color que va rotando por la posición en la lista. */
export function OrderAvatar({ name, index, size = "md" }: Props) {
  const box = size === "md" ? "size-11 rounded-[14px] text-[15px]" : "size-10 rounded-xl text-sm";
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center font-bold ${box} ${AVATARS[index % AVATARS.length]}`}
    >
      {initials(name)}
    </span>
  );
}
