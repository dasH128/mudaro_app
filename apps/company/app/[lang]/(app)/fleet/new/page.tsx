import type { Metadata } from "next";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";

import { hasLocale } from "@/app/i18n/config";
import { requireCompanySession } from "@/features/auth/application/require-session";
import { getDictionary } from "@/app/i18n/get-dictionary";
import type { FleetSnapshot } from "@/features/fleet/domain/new-vehicle";
import { getFleetOverview } from "@/features/fleet/infrastructure/fleet.repo";
import { NewVehicleForm } from "@/features/fleet/presentation/components/new-vehicle-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.metadata.fleetNewTitle };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Solo los administradores entran en el panel (requireCompanySession), así que ven el coste por km (RNF-03).
export default async function NewVehiclePage({ searchParams }: PageProps<"/[lang]/fleet/new">) {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  await requireCompanySession(locale);

  const t = (await getDictionary()).app.fleet;
  const params = await searchParams;

  const { vehicles } = await getFleetOverview({ includeCost: true });

  const fleet: FleetSnapshot = {
    vehicles: vehicles.map(({ name, plate, kind }) => ({ name, plate, kind })),
    activeCapacityM3: vehicles.filter((v) => v.active).reduce((sum, v) => sum + v.capacityM3, 0),
  };

  // Aviso tras "Adicionar e criar outro": solo con un vehículo que existe, para no pintar texto de la URL
  const added = vehicles.find((v) => v.id === first(params.added));

  return (
    // La clave reinicia el formulario tras "criar outro" (nueva sugerencia de nombre incluida)
    <NewVehicleForm
      key={added?.id ?? "new"}
      lang={locale}
      t={t.new}
      statusLabels={t.status}
      fleetTitle={t.title}
      fleet={fleet}
      addedPlate={added?.plate}
    />
  );
}
