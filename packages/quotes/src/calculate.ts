// Motor de cálculo del orçamento (RF-30 a RF-37). TypeScript puro.
//
// Reglas (provisionales, P3 del plan del paso 5, a confirmar con empresas del piloto):
//   - Volumen ajustado = volumen declarado × factor de estiba (RF-30).
//   - Vehículos: la combinación de vehículos activos con menos capacidad que cubre el volumen; si ninguna llega, todos
//     con los viajes necesarios (RF-31).
//   - Operários: por tramos de volumen de la tarifa, +1 si hay objetos de "pessoal extra" (RF-32).
//   - Horas de manipulación: los minutos de manipulación de cada objeto (catálogo) son minutos de una persona para
//     cargarlo, y otros tantos para descargarlo. Carga en el origen y descarga en el destino; cada parada suma un
//     cuarto de la carga. El acceso de cada punto los aumenta: +X % por piso sin elevador (la mitad con elevador
//     pequeño) y +Y % por cada 25 m de estacionamiento (RF-33).
//   - Viaje: km (los escribe la empresa en el piloto, de la base a la base) × viajes / velocidad media (RF-34).
//   - Horas totales = manipulación / operários + viaje, redondeadas hacia arriba a la media hora.
//   - Precio = mano de obra + km + suplementos de acceso; si queda por debajo del mínimo, el mínimo (RF-35).
//   - Coste = horas de operário × coste por hora + km × coste por km de cada vehículo usado.
//   - Alertas antes de enviar (RF-36).

import type { ItemFlag, LiftSize } from "@mudaro/inventory";

/** Una línea del inventario vigente. Los objetos libres sin medidas llegan sin volumen o sin minutos. */
export type CalcLine = {
  quantity: number;
  /** Volumen por unidad, en m³. `null` = objeto libre sin medidas (RF-21). */
  unitVolumeM3: number | null;
  /** Minutos de una persona para cargar una unidad. `null` = sin dato. */
  unitMinutes: number | null;
  flags: readonly ItemFlag[];
};

/** Accesos de un punto del recorrido. */
export type CalcPoint = {
  role: "origin" | "stop" | "destination";
  floor: number;
  lift: LiftSize;
  parkingMeters: number;
};

/** Lo que el cálculo usa de la tarifa (RF-06). Los importes en céntimos. */
export type CalcTariff = {
  operatorHourPriceCents: number;
  operatorHourCostCents: number;
  kmPriceCents: number;
  noLiftFloorSurchargeCents: number;
  parkingSurchargeCents: number;
  minimumServiceCents: number;
  stowageFactor: number;
  averageSpeedKmh: number;
  noLiftFloorExtraPct: number;
  parkingExtraPctPer25m: number;
  crewSmall: number;
  crewSmallMaxM3: number;
  crewMedium: number;
  crewMediumMaxM3: number;
  crewLarge: number;
};

/** Vehículo activo de la frota. */
export type CalcVehicle = {
  id: string;
  name: string;
  capacityM3: number;
  /** Coste por km. `null` = sin coste registrado (el coste del orçamento sale por debajo de lo real). */
  costPerKmCents: number | null;
};

export type CalcInput = {
  lines: readonly CalcLine[];
  points: readonly CalcPoint[];
  tariff: CalcTariff;
  vehicles: readonly CalcVehicle[];
  /** Km totales del recorrido, de la base a la base. `null` = aún sin escribir. */
  km: number | null;
};

/** Avisos que la empresa ve antes de enviar (RF-36). Son códigos: el texto lo pone la interfaz. */
export type CalcAlert =
  | { kind: "no-lift"; floors: number }
  | { kind: "far-parking"; meters: number }
  | { kind: "special-items"; fragile: number; dismantle: number; extraCrew: number }
  | { kind: "unmeasured"; count: number }
  | { kind: "extra-trips"; trips: number }
  | { kind: "no-vehicles" }
  | { kind: "no-km" }
  | { kind: "minimum-applied"; minimumCents: number }
  | { kind: "missing-vehicle-cost" };

/** Línea base que propone el cálculo. El editor la copia al orçamento y la empresa la puede cambiar. */
export type CalcBaseLine = {
  code: "labour" | "transport" | "floor-surcharge" | "parking-surcharge" | "minimum";
  quantity: number;
  unit: "h" | "km" | "un" | null;
  unitPriceCents: number;
  totalCents: number;
};

/** Valores que la empresa cambia a mano en el editor (RF-37). Sin ellos se usa lo sugerido. */
export type CalcOverrides = {
  operators?: number;
  /** Horas del equipo. */
  totalHours?: number;
};

export type CalcResult = {
  declaredVolumeM3: number;
  adjustedVolumeM3: number;
  vehicles: readonly CalcVehicle[];
  trips: number;
  /** Operários sugeridos por la tarifa (RF-32), aunque la empresa los cambie. */
  suggestedOperators: number;
  operators: number;
  /** Minutos de una persona para cargar y descargar, ya con el acceso. */
  handlingPersonMinutes: number;
  travelHours: number;
  /** Horas sugeridas, redondeadas a la media hora (RF-33, RF-34). */
  suggestedHours: number;
  /** Horas del equipo con las que se calcula: las sugeridas o las que puso la empresa. */
  totalHours: number;
  kmTotal: number;
  /** Precio por hora del equipo (operários × precio por hora), para presentar el orçamento por hora. */
  hourlyRateCents: number;
  lines: readonly CalcBaseLine[];
  priceCents: number;
  costCents: number;
  /** De 0 a 1. `null` si el precio es 0. */
  margin: number | null;
  alerts: readonly CalcAlert[];
};

/** Estacionamiento a partir del cual se cobra el suplemento y se avisa. El mismo umbral que el detalle del pedido. */
export const FAR_PARKING_METERS = 50;
/** Parte de la carga que supone cada parada. */
const STOP_SHARE = 0.25;

const round2 = (value: number) => Math.round(value * 100) / 100;
const ceilHalf = (hours: number) => Math.ceil(hours * 2) / 2;

/** Pisos que se suben sin elevador en un punto (la mitad con elevador pequeño). */
function liftlessFloors(point: CalcPoint): number {
  const floors = Math.max(point.floor, 0);
  if (point.lift === "none") return floors;
  if (point.lift === "small") return floors / 2;
  return 0;
}

/** Factor de acceso de un punto: 1 = sin dificultad (RF-33). */
export function accessFactor(point: CalcPoint, tariff: Pick<CalcTariff, "noLiftFloorExtraPct" | "parkingExtraPctPer25m">): number {
  const floors = liftlessFloors(point) * tariff.noLiftFloorExtraPct;
  const parking = Math.floor(Math.max(point.parkingMeters, 0) / 25) * tariff.parkingExtraPctPer25m;
  return 1 + (floors + parking) / 100;
}

/** Operários sugeridos (RF-32): por tramos de volumen, +1 con objetos de "pessoal extra". */
export function suggestCrew(tariff: CalcTariff, adjustedVolumeM3: number, hasExtraCrewItems: boolean): number {
  const base =
    adjustedVolumeM3 <= tariff.crewSmallMaxM3 ? tariff.crewSmall : adjustedVolumeM3 <= tariff.crewMediumMaxM3 ? tariff.crewMedium : tariff.crewLarge;
  return base + (hasExtraCrewItems ? 1 : 0);
}

/**
 * Vehículos (RF-31): la combinación con menos capacidad total que cubre el volumen; a igual capacidad, la de menos
 * vehículos. Si ninguna llega, todos los vehículos y los viajes necesarios. Una frota de piloto tiene pocos
 * vehículos: se prueban todas las combinaciones (hasta 12 vehículos; con más, los 12 de más capacidad).
 */
export function chooseVehicles(vehicles: readonly CalcVehicle[], volumeM3: number): { vehicles: CalcVehicle[]; trips: number } {
  const usable = [...vehicles].filter((v) => v.capacityM3 > 0).sort((a, b) => b.capacityM3 - a.capacityM3).slice(0, 12);
  if (usable.length === 0) return { vehicles: [], trips: 0 };
  if (volumeM3 <= 0) return { vehicles: [usable[usable.length - 1]], trips: 1 };

  let best: { set: CalcVehicle[]; capacity: number } | null = null;
  for (let mask = 1; mask < 1 << usable.length; mask++) {
    const set = usable.filter((_, index) => mask & (1 << index));
    const capacity = set.reduce((sum, v) => sum + v.capacityM3, 0);
    if (capacity < volumeM3) continue;
    if (!best || capacity < best.capacity || (capacity === best.capacity && set.length < best.set.length)) best = { set, capacity };
  }
  if (best) return { vehicles: best.set, trips: 1 };

  const total = usable.reduce((sum, v) => sum + v.capacityM3, 0);
  return { vehicles: usable, trips: Math.ceil(volumeM3 / total) };
}

/** Calcula el orçamento sugerido a partir del inventario, los accesos, la tarifa, la frota y los km. */
export function calculateQuote(input: CalcInput, overrides: CalcOverrides = {}): CalcResult {
  const { tariff } = input;
  const alerts: CalcAlert[] = [];

  // Volumen (RF-30)
  const declaredVolumeM3 = round2(input.lines.reduce((sum, line) => sum + line.quantity * (line.unitVolumeM3 ?? 0), 0));
  const adjustedVolumeM3 = round2(declaredVolumeM3 * tariff.stowageFactor);

  const count = (flag: ItemFlag) => input.lines.reduce((sum, line) => sum + (line.flags.includes(flag) ? line.quantity : 0), 0);
  const special = { fragile: count("fragile"), dismantle: count("dismantle"), extraCrew: count("extra-crew") };
  if (special.fragile + special.dismantle + special.extraCrew > 0) alerts.push({ kind: "special-items", ...special });
  const unmeasured = input.lines.filter((line) => line.unitVolumeM3 === null || line.unitMinutes === null).length;
  if (unmeasured > 0) alerts.push({ kind: "unmeasured", count: unmeasured });

  // Vehículos y operários (RF-31, RF-32)
  const fleet = chooseVehicles(input.vehicles, adjustedVolumeM3);
  if (fleet.vehicles.length === 0) alerts.push({ kind: "no-vehicles" });
  if (fleet.trips > 1) alerts.push({ kind: "extra-trips", trips: fleet.trips });
  const trips = Math.max(fleet.trips, 1);
  const suggestedOperators = suggestCrew(tariff, adjustedVolumeM3, special.extraCrew > 0);
  const operators = overrides.operators && overrides.operators > 0 ? Math.round(overrides.operators) : suggestedOperators;

  // Manipulación con acceso (RF-33)
  const baseMinutes = input.lines.reduce((sum, line) => sum + line.quantity * (line.unitMinutes ?? 0), 0);
  const handlingPersonMinutes = round2(
    input.points.reduce((sum, point) => {
      const share = point.role === "stop" ? STOP_SHARE : 1;
      return sum + baseMinutes * share * accessFactor(point, tariff);
    }, 0),
  );

  const noLiftFloors = input.points.reduce((sum, point) => sum + (point.lift === "none" ? Math.max(point.floor, 0) : 0), 0);
  if (noLiftFloors > 0) alerts.push({ kind: "no-lift", floors: noLiftFloors });
  const farPoints = input.points.filter((point) => point.parkingMeters >= FAR_PARKING_METERS);
  if (farPoints.length > 0) alerts.push({ kind: "far-parking", meters: Math.max(...farPoints.map((point) => point.parkingMeters)) });

  // Viaje (RF-34): en el piloto, los km los escribe la empresa
  if (input.km === null) alerts.push({ kind: "no-km" });
  const kmTotal = round2((input.km ?? 0) * trips);
  const travelHours = tariff.averageSpeedKmh > 0 ? round2(kmTotal / tariff.averageSpeedKmh) : 0;

  // Lo sugerido usa los operários sugeridos: cambiar el equipo a mano no cambia la sugerencia, solo el cálculo.
  const suggestedHours = ceilHalf(handlingPersonMinutes / 60 / suggestedOperators + travelHours);
  const totalHours =
    overrides.totalHours && overrides.totalHours > 0
      ? round2(overrides.totalHours)
      : overrides.operators
        ? ceilHalf(handlingPersonMinutes / 60 / operators + travelHours)
        : suggestedHours;
  const operatorHours = round2(operators * totalHours);

  // Precio (RF-35)
  const lines: CalcBaseLine[] = [];
  const add = (line: Omit<CalcBaseLine, "totalCents">) => {
    if (line.quantity <= 0) return;
    lines.push({ ...line, totalCents: Math.round(line.quantity * line.unitPriceCents) });
  };
  add({ code: "labour", quantity: operatorHours, unit: "h", unitPriceCents: tariff.operatorHourPriceCents });
  add({ code: "transport", quantity: kmTotal, unit: "km", unitPriceCents: tariff.kmPriceCents });
  if (tariff.noLiftFloorSurchargeCents > 0) {
    add({ code: "floor-surcharge", quantity: noLiftFloors, unit: "un", unitPriceCents: tariff.noLiftFloorSurchargeCents });
  }
  if (tariff.parkingSurchargeCents > 0) {
    add({ code: "parking-surcharge", quantity: farPoints.length, unit: "un", unitPriceCents: tariff.parkingSurchargeCents });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.totalCents, 0);
  if (subtotal < tariff.minimumServiceCents) {
    const difference = tariff.minimumServiceCents - subtotal;
    lines.push({ code: "minimum", quantity: 1, unit: null, unitPriceCents: difference, totalCents: difference });
    alerts.push({ kind: "minimum-applied", minimumCents: tariff.minimumServiceCents });
  }
  const priceCents = lines.reduce((sum, line) => sum + line.totalCents, 0);

  // Coste (RF-35): solo administradores (RNF-03)
  const vehicleCost = fleet.vehicles.reduce((sum, v) => sum + (v.costPerKmCents ?? 0), 0) * kmTotal;
  if (fleet.vehicles.some((v) => v.costPerKmCents === null)) alerts.push({ kind: "missing-vehicle-cost" });
  const costCents = Math.round(operatorHours * tariff.operatorHourCostCents + vehicleCost);

  return {
    declaredVolumeM3,
    adjustedVolumeM3,
    vehicles: fleet.vehicles,
    trips,
    suggestedOperators,
    operators,
    handlingPersonMinutes,
    travelHours,
    suggestedHours,
    totalHours,
    kmTotal,
    hourlyRateCents: operators * tariff.operatorHourPriceCents,
    lines,
    priceCents,
    costCents,
    margin: priceCents > 0 ? (priceCents - costCents) / priceCents : null,
    alerts,
  };
}

/** Subtotal, IVA y total de unas líneas (sin IVA), igual que `quote_totals` en la base. */
export function totalsOf(lines: readonly { totalCents: number; optional?: boolean; selected?: boolean }[], vatPct: number) {
  const subtotalCents = lines.reduce((sum, line) => sum + (!line.optional || line.selected ? line.totalCents : 0), 0);
  const vatCents = Math.round((subtotalCents * vatPct) / 100);
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
