import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { hasLocale } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/get-dictionary";
import { pluralize } from "@/app/i18n/interpolate";
import { todayLisbon } from "@/app/lib/format";
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_VIEW,
  arrangeTeam,
  countByFilter,
  isFilter,
  isSort,
  isView,
  summarize,
  teamAlerts,
} from "@/features/team/domain/team";
import { getTeamOverview } from "@/features/team/infrastructure/team.repo";
import { PersonPanel } from "@/features/team/presentation/components/person-panel";
import { TeamEmpty } from "@/features/team/presentation/components/team-empty";
import { TeamAdmins } from "@/features/team/presentation/components/team-admins";
import { TeamAlertsSection } from "@/features/team/presentation/components/team-alerts";
import { TeamCards } from "@/features/team/presentation/components/team-cards";
import { TeamHeader } from "@/features/team/presentation/components/team-header";
import { TeamTable } from "@/features/team/presentation/components/team-table";
import { TeamToolbar } from "@/features/team/presentation/components/team-toolbar";
import { teamHref } from "@/features/team/presentation/team-href";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.teamTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// TODO(auth): el grupo (app) aún no tiene sesión ni rol. Cuando exista, la página comprueba sesión y rol en servidor
// (solo administradores gestionan el equipo).
export default async function TeamPage({ searchParams }: PageProps<"/[lang]/team">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();

  const t = (await getDictionary()).app.team;

  const params = await searchParams;
  const filterParam = first(params.filter);
  const sortParam = first(params.sort);
  const viewParam = first(params.view);
  const filter = isFilter(filterParam) ? filterParam : DEFAULT_FILTER;
  const sort = isSort(sortParam) ? sortParam : DEFAULT_SORT;
  const view = isView(viewParam) ? viewParam : DEFAULT_VIEW;
  const q = first(params.q)?.trim() ?? "";

  // "Livre agora", "expira amanhã" y los trabajos de la semana dependen de hoy
  await connection();
  const today = todayLisbon();
  // TODO(supabase): `?empty=1` solo sirve para ver el estado vacío con los datos de ejemplo
  const { people, admins, metrics } = await getTeamOverview({ today, empty: first(params.empty) === "1" });

  // Primer uso: nadie en el equipo (ni operarios ni convites)
  if (people.length === 0) return <TeamEmpty t={t} admin={admins.find((a) => a.you) ?? admins[0]} />;

  const arranged = arrangeTeam(people, { filter, q, sort }, today);

  // La persona abierta sigue visible aunque el filtro la excluya: se añade al final, como en el diseño
  const requested = first(params.person);
  const opened = people.find((p) => p.id === requested);
  const order = opened && !arranged.all.includes(opened) ? [...arranged.all, opened] : arranged.all;
  const index = opened ? order.indexOf(opened) : -1;

  const base = { filter, q, sort, view };
  const hrefFor = (position: number) => teamHref(locale, { ...base, person: order[(position + order.length) % order.length]?.id });
  const emptyMessage = q !== "" ? t.table.emptySearch : t.table.emptyFilter;

  return (
    <>
      <TeamHeader lang={locale} t={t} summary={summarize(people)} />
      <TeamAlertsSection lang={locale} t={t} alerts={teamAlerts(people, metrics, today)} today={today} />
      <TeamToolbar
        lang={locale}
        t={t}
        filter={filter}
        q={q}
        sort={sort}
        view={view}
        person={opened?.id}
        counts={countByFilter(people)}
      />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {view === "list" ? (
            <TeamTable
              lang={locale}
              t={t}
              active={arranged.active}
              inactive={arranged.inactive}
              selectedId={opened?.id}
              params={base}
              today={today}
              compact={opened !== undefined}
              emptyMessage={emptyMessage}
            />
          ) : (
            <TeamCards
              lang={locale}
              t={t}
              people={arranged.all}
              selectedId={opened?.id}
              params={base}
              today={today}
              emptyMessage={emptyMessage}
            />
          )}
          <p className="sr-only" aria-live="polite">
            {pluralize(locale, arranged.all.length, t.resultsCount)}
          </p>
          <TeamAdmins lang={locale} t={t} admins={admins} today={today} />
        </div>

        {opened ? (
          <PersonPanel
            lang={locale}
            t={t}
            person={opened}
            today={today}
            position={index + 1}
            total={order.length}
            previousHref={hrefFor(index - 1)}
            nextHref={hrefFor(index + 1)}
            closeHref={teamHref(locale, base)}
          />
        ) : null}
      </div>
    </>
  );
}
