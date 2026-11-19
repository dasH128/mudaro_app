// Esqueleto mientras llegan el pedido, el inventario, la tarifa y la frota.
export default function QuoteEditorLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="h-5 w-56 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-12 w-96 max-w-full animate-pulse rounded-lg bg-line-soft" />
      <div className="flex flex-wrap gap-5">
        <div className="h-140 flex-[999_1_640px] animate-pulse rounded-[22px] bg-line-soft" />
        <div className="h-96 flex-[1_1_300px] animate-pulse rounded-[22px] bg-line-soft" />
      </div>
    </div>
  );
}
