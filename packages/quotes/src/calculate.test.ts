import { describe, expect, it } from "vitest";

import { accessFactor, calculateQuote, chooseVehicles, suggestCrew, totalsOf, type CalcInput, type CalcTariff, type CalcVehicle } from "./calculate";

// Tarifa de la empresa de prueba (versión 2 de Mudanzas Peru): 18 €/h de precio, 9 €/h de coste, 0,60 €/km, mínimo 120 €.
const TARIFF: CalcTariff = {
  operatorHourPriceCents: 1800,
  operatorHourCostCents: 900,
  kmPriceCents: 60,
  noLiftFloorSurchargeCents: 0,
  parkingSurchargeCents: 0,
  minimumServiceCents: 12000,
  stowageFactor: 1.2,
  averageSpeedKmh: 50,
  noLiftFloorExtraPct: 10,
  parkingExtraPctPer25m: 5,
  crewSmall: 2,
  crewSmallMaxM3: 15,
  crewMedium: 3,
  crewMediumMaxM3: 30,
  crewLarge: 4,
};

const vehicle = (id: string, capacityM3: number, costPerKmCents: number | null = 50): CalcVehicle => ({ id, name: id, capacityM3, costPerKmCents });

describe("accessFactor (RF-33)", () => {
  it("sube un 10 % por piso sin elevador", () => {
    expect(accessFactor({ role: "origin", floor: 3, lift: "none", parkingMeters: 0 }, TARIFF)).toBeCloseTo(1.3);
  });
  it("cuenta la mitad de los pisos con elevador pequeño y nada con elevador normal", () => {
    expect(accessFactor({ role: "origin", floor: 3, lift: "small", parkingMeters: 0 }, TARIFF)).toBeCloseTo(1.15);
    expect(accessFactor({ role: "origin", floor: 3, lift: "normal", parkingMeters: 0 }, TARIFF)).toBe(1);
  });
  it("suma un 5 % por cada 25 m completos de estacionamiento", () => {
    expect(accessFactor({ role: "origin", floor: 0, lift: "none", parkingMeters: 60 }, TARIFF)).toBeCloseTo(1.1);
    expect(accessFactor({ role: "origin", floor: 0, lift: "none", parkingMeters: 24 }, TARIFF)).toBe(1);
  });
  it("una cave (piso negativo) no cuenta como piso a subir", () => {
    expect(accessFactor({ role: "origin", floor: -1, lift: "none", parkingMeters: 0 }, TARIFF)).toBe(1);
  });
});

describe("suggestCrew (RF-32)", () => {
  it("usa los tramos de la tarifa", () => {
    expect(suggestCrew(TARIFF, 15, false)).toBe(2);
    expect(suggestCrew(TARIFF, 15.01, false)).toBe(3);
    expect(suggestCrew(TARIFF, 30, false)).toBe(3);
    expect(suggestCrew(TARIFF, 31, false)).toBe(4);
  });
  it("suma un operário con objetos de pessoal extra", () => {
    expect(suggestCrew(TARIFF, 10, true)).toBe(3);
  });
});

describe("chooseVehicles (RF-31)", () => {
  const fleet = [vehicle("grande", 20), vehicle("medio", 12), vehicle("pequeno", 8)];

  it("elige el más pequeño que cubre el volumen", () => {
    expect(chooseVehicles(fleet, 10).vehicles.map((v) => v.id)).toEqual(["medio"]);
  });
  it("a igual capacidad, prefiere menos vehículos", () => {
    expect(chooseVehicles(fleet, 19).vehicles.map((v) => v.id)).toEqual(["grande"]);
  });
  it("combina vehículos cuando uno no llega", () => {
    expect(chooseVehicles(fleet, 25).vehicles.map((v) => v.id)).toEqual(["grande", "pequeno"]);
  });
  it("si ni la frota entera llega, calcula los viajes", () => {
    const result = chooseVehicles(fleet, 50);
    expect(result.vehicles).toHaveLength(3);
    expect(result.trips).toBe(2);
  });
  it("sin vehículos no hay viajes", () => {
    expect(chooseVehicles([], 10)).toEqual({ vehicles: [], trips: 0 });
  });
});

describe("calculateQuote", () => {
  // 1 sofá (1,5 m³, 30 min) y 3 cadeiras (0,1 m³, 5 min). Origen: 3.º sin elevador, 20 m. Destino: 1.º con elevador
  // pequeño, 60 m. 30 km. Frota: un camión de 20 m³ y una carrinha de 8 m³ (30 cént./km).
  const input: CalcInput = {
    lines: [
      { quantity: 1, unitVolumeM3: 1.5, unitMinutes: 30, flags: [] },
      { quantity: 3, unitVolumeM3: 0.1, unitMinutes: 5, flags: [] },
    ],
    points: [
      { role: "origin", floor: 3, lift: "none", parkingMeters: 20 },
      { role: "destination", floor: 1, lift: "small", parkingMeters: 60 },
    ],
    tariff: TARIFF,
    vehicles: [vehicle("camiao", 20, 50), vehicle("carrinha", 8, 30)],
    km: 30,
  };

  it("calcula volumen, equipo, horas, precio, coste y margen", () => {
    const result = calculateQuote(input);
    expect(result.declaredVolumeM3).toBe(1.8);
    expect(result.adjustedVolumeM3).toBe(2.16);
    expect(result.vehicles.map((v) => v.id)).toEqual(["carrinha"]);
    expect(result.operators).toBe(2);
    // 45 min × 1,3 (origen) + 45 min × 1,15 (destino)
    expect(result.handlingPersonMinutes).toBe(110.25);
    expect(result.travelHours).toBe(0.6);
    // 110,25 / 60 / 2 + 0,6 = 1,52 h → 2 h
    expect(result.totalHours).toBe(2);
    expect(result.hourlyRateCents).toBe(3600);
    // 4 h de operário × 18 € + 30 km × 0,60 € = 90 €, por debajo del mínimo de 120 €
    expect(result.lines).toEqual([
      { code: "labour", quantity: 4, unit: "h", unitPriceCents: 1800, totalCents: 7200 },
      { code: "transport", quantity: 30, unit: "km", unitPriceCents: 60, totalCents: 1800 },
      { code: "minimum", quantity: 1, unit: null, unitPriceCents: 3000, totalCents: 3000 },
    ]);
    expect(result.priceCents).toBe(12000);
    // 4 h × 9 € + 30 km × 0,30 €
    expect(result.costCents).toBe(4500);
    expect(result.margin).toBeCloseTo(0.625);
  });

  it("avisa de lo que pide atención (RF-36)", () => {
    const kinds = calculateQuote(input).alerts.map((alert) => alert.kind);
    expect(kinds).toEqual(["no-lift", "far-parking", "minimum-applied"]);
  });

  it("cambiar el piso o el elevador cambia las horas (RF-33)", () => {
    const easy = calculateQuote({ ...input, points: input.points.map((p) => ({ ...p, lift: "normal" as const, parkingMeters: 0 })) });
    expect(easy.handlingPersonMinutes).toBe(90);
    expect(easy.handlingPersonMinutes).toBeLessThan(calculateQuote(input).handlingPersonMinutes);
  });

  it("cada parada suma un cuarto de la carga", () => {
    const withStop = calculateQuote({ ...input, points: [...input.points, { role: "stop", floor: 0, lift: "none", parkingMeters: 0 }] });
    expect(withStop.handlingPersonMinutes).toBe(110.25 + 45 * 0.25);
  });

  it("aplica suplementos de acceso si la tarifa los tiene", () => {
    const result = calculateQuote({ ...input, tariff: { ...TARIFF, noLiftFloorSurchargeCents: 1000, parkingSurchargeCents: 1500 } });
    expect(result.lines.find((l) => l.code === "floor-surcharge")).toMatchObject({ quantity: 3, totalCents: 3000 });
    expect(result.lines.find((l) => l.code === "parking-surcharge")).toMatchObject({ quantity: 1, totalCents: 1500 });
  });

  it("sin km, sin vehículos, con objetos sin medidas y de pessoal extra", () => {
    const result = calculateQuote({
      ...input,
      km: null,
      vehicles: [],
      lines: [...input.lines, { quantity: 1, unitVolumeM3: null, unitMinutes: null, flags: ["extra-crew"] }],
    });
    expect(result.operators).toBe(3);
    expect(result.kmTotal).toBe(0);
    expect(result.alerts.map((a) => a.kind)).toEqual(
      expect.arrayContaining(["no-km", "no-vehicles", "unmeasured", "special-items"]),
    );
  });

  it("con viajes de más, multiplica los km", () => {
    const big = calculateQuote({ ...input, lines: [{ quantity: 30, unitVolumeM3: 1, unitMinutes: 10, flags: [] }] });
    expect(big.adjustedVolumeM3).toBe(36);
    expect(big.trips).toBe(2);
    expect(big.kmTotal).toBe(60);
    expect(big.alerts.map((a) => a.kind)).toContain("extra-trips");
  });

  it("avisa si un vehículo usado no tiene coste por km", () => {
    const result = calculateQuote({ ...input, vehicles: [vehicle("sem-custo", 8, null)] });
    expect(result.alerts.map((a) => a.kind)).toContain("missing-vehicle-cost");
  });
});

describe("totalsOf", () => {
  it("suma las incluidas y las opcionales elegidas, con IVA redondeado", () => {
    const lines = [
      { totalCents: 21600 },
      { totalCents: 1200 },
      { totalCents: 4000 },
      { totalCents: 5000, optional: true, selected: false },
    ];
    expect(totalsOf(lines, 23)).toEqual({ subtotalCents: 26800, vatCents: 6164, totalCents: 32964 });
    expect(totalsOf(lines.map((l) => (l.optional ? { ...l, selected: true } : l)), 23)).toEqual({
      subtotalCents: 31800,
      vatCents: 7314,
      totalCents: 39114,
    });
  });
});
