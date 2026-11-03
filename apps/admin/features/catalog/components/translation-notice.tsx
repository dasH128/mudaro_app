import { ButtonLink } from "@/app/components/ui/button";
import { catalogHref } from "./catalog-href";

export function TranslationNotice({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warn-border bg-warn-surface px-4 py-3 text-sm text-warn-foreground">
      <span className="flex-[1_1_320px]">
        {count === 1 ? "1 objeto ativo sem tradução completa." : `${count} objetos ativos sem tradução completa.`} Os
        clientes em espanhol ou inglês vão vê-los em português.
      </span>
      <ButtonLink
        variant="secondary"
        size="sm"
        href={catalogHref("objects", { mark: "translation_missing", state: "active" })}
        className="border-warn-border text-warn-foreground"
      >
        Ver objetos
      </ButtonLink>
    </div>
  );
}
