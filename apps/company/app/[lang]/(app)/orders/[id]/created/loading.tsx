// Esqueleto mientras llega el pedido (la ruta lleva el número de pedido, que solo se conoce al pedirla).
export default function OrderCreatedLoading() {
  return (
    <div aria-hidden="true" className="mx-auto flex w-full max-w-190 flex-col gap-5">
      <div className="h-5 w-40 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-16 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-120 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-32 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
