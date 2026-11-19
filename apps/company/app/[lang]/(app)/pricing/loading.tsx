// Esqueleto mientras llegan la tarifa y los servicios extra de la empresa.
export default function PricingLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="h-24 animate-pulse rounded-2xl bg-line-soft" />
      <div className="flex flex-wrap gap-5">
        <div className="h-120 flex-[999_1_620px] animate-pulse rounded-[22px] bg-line-soft" />
        <div className="h-80 flex-[1_1_360px] animate-pulse rounded-[22px] bg-line-soft" />
      </div>
    </div>
  );
}
