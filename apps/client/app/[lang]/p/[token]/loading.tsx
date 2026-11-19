// Esqueleto mientras llega el pedido (lo devuelve la Edge Function con el token del enlace).
export default function OrderLinkLoading() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="h-7 w-32 animate-pulse rounded-lg bg-line-soft" />
      <div className="h-12 w-96 max-w-full animate-pulse rounded-lg bg-line-soft" />
      <div className="h-18 animate-pulse rounded-2xl bg-line-soft" />
      <div className="h-120 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}
