import { StatusPill, type PillTone } from "@/app/components/ui/status-pill";
import type { CareMark, CatalogItem } from "../domain/types";

const MARK_LABEL: Record<CareMark, string> = {
  fragile: "Frágil",
  disassembly: "Desmontagem",
  extra_crew: "Equipa extra",
};

const MARK_ICON: Record<CareMark, string> = {
  fragile: "◇",
  disassembly: "⚒",
  extra_crew: "+",
};

const MARK_TONE: Record<CareMark, PillTone> = {
  fragile: "outline",
  disassembly: "setup",
  extra_crew: "solid",
};

export function CareMarks({ marks }: { marks: readonly CareMark[] }) {
  if (marks.length === 0) return <span className="text-[13px] text-field-border">–</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {marks.map((mark) => (
        <StatusPill key={mark} tone={MARK_TONE[mark]} size="sm">
          <span aria-hidden="true">{MARK_ICON[mark]}</span> {MARK_LABEL[mark]}
        </StatusPill>
      ))}
    </div>
  );
}

export function Translations({ item }: { item: CatalogItem }) {
  const langs = [
    { code: "PT", done: true },
    { code: "ES", done: !!item.es },
    { code: "EN", done: !!item.en },
  ];
  return (
    <div className="flex gap-1">
      {langs.map(({ code, done }) => (
        <span key={code} title={done ? "Traduzido" : "Em falta"}>
          <StatusPill tone={done ? "solid" : "warn"} size="sm">
            {code}
            {!done && <span className="sr-only"> em falta</span>}
          </StatusPill>
        </span>
      ))}
    </div>
  );
}
