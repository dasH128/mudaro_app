// Esqueleto mientras llega el pedido (la ruta lleva el número de pedido, que solo se conoce al pedirla).
export default function OrderDetailLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="h-5 w-40 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-16 w-96 max-w-full animate-pulse rounded-lg bg-line-soft" />
      <div className="h-28 animate-pulse rounded-3xl bg-line-soft" />
      <div className="h-120 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
