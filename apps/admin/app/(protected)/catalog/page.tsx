import type { Metadata } from "next";

import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { requirePlatformUser } from "@/app/lib/auth";
import { listCategories, listItems, listRooms } from "@/features/catalog/data/catalog.repo";
import {
  countActiveBy,
  filterItems,
  isMissingTranslation,
  isTab,
  parseObjectFilters,
} from "@/features/catalog/domain/filters";
import { CatalogTabs } from "@/features/catalog/components/catalog-tabs";
import { GroupDialogProvider, NewGroupButton } from "@/features/catalog/components/group-dialog";
import { GroupsTable } from "@/features/catalog/components/groups-table";
import { ObjectFilters } from "@/features/catalog/components/object-filters";
import { ObjectsTable } from "@/features/catalog/components/objects-table";
import { TranslationNotice } from "@/features/catalog/components/translation-notice";

export const metadata: Metadata = {
  title: "Painel Mudaro · Catálogo global",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const INTRO = {
  rooms:
    "Onde estão as coisas. O cliente percorre a casa por divisões. Um objeto pode aparecer em várias divisões.",
  categories:
    "O que são as coisas. Agrupam os objetos dentro de cada divisão e organizam o catálogo. Cada objeto tem uma só categoria.",
} as const;

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  // El layout no basta: los layouts no se vuelven a renderizar en cada navegación.
  await requirePlatformUser();

  const params = await searchParams;
  const tabParam = first(params.tab);
  const tab = isTab(tabParam) ? tabParam : "objects";

  const [items, rooms, categories] = await Promise.all([listItems(), listRooms(), listCategories()]);

  const header = (action: React.ReactNode) => (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <PageTitle>Catálogo global</PageTitle>
        <p className="m-0 max-w-[640px] text-[15px] text-muted">
          Base de todas as empresas e clientes. Os inventários copiam os valores no momento em que o objeto é
          adicionado: alterar aqui não muda inventários nem propostas já feitos.
        </p>
      </div>
      {action}
    </div>
  );

  const tabs = (
    <CatalogTabs selected={tab} counts={{ objects: items.length, rooms: rooms.length, categories: categories.length }} />
  );

  if (tab === "objects") {
    const filters = parseObjectFilters(
      { q: first(params.q), category: first(params.category), room: first(params.room), mark: first(params.mark), state: first(params.state) },
      categories,
      rooms,
    );
    const shown = filterItems(items, filters);
    const missing = items.filter((i) => i.active && isMissingTranslation(i)).length;

    return (
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
        {header(
          // La pantalla "Novo objeto" aún no tiene diseño.
          <Button disabled>
            Novo objeto<span className="sr-only"> (em breve)</span>
          </Button>,
        )}
        {tabs}
        {missing > 0 && <TranslationNotice count={missing} />}
        <ObjectFilters filters={filters} categories={categories} rooms={rooms} />
        <p role="status" className="sr-only">
          {shown.length === 1 ? "1 objeto" : `${shown.length} objetos`}
        </p>
        <ObjectsTable items={shown} categories={categories} rooms={rooms} />
        <p className="m-0 text-[13px] text-muted">
          A mostrar {shown.length} de {items.length} objetos. Os cuidados são valores por defeito: o
          cliente e a empresa ajustam-nos em cada inventário. Volumes, pesos e tempos a validar com transportistas
          antes do piloto (RF-10).
        </p>
      </div>
    );
  }

  const isRooms = tab === "rooms";
  return (
    <GroupDialogProvider kind={isRooms ? "room" : "category"}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-7">
        {header(<NewGroupButton>{isRooms ? "Nova divisão" : "Nova categoria"}</NewGroupButton>)}
        {tabs}
        <p className="m-0 max-w-[720px] text-[15px] text-muted">{INTRO[tab]}</p>
        <GroupsTable
          label={isRooms ? "divisões" : "categorias"}
          groups={isRooms ? rooms : categories}
          counts={countActiveBy(items, tab)}
        />
        <p className="m-0 text-[13px] text-muted">
          A ordem define a sequência no inventário do cliente. {isRooms ? "Uma divisão" : "Uma categoria"} com objetos
          não se apaga: desativa-se.
        </p>
      </div>
    </GroupDialogProvider>
  );
}
