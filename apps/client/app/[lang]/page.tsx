import { getDictionary } from "@/app/i18n/get-dictionary";
import { ClientBrand, StatusCard } from "@/features/order/presentation/components/order-status";

// Sin token no hay nada que mostrar: el cliente solo entra por el enlace de su pedido.
export default async function HomePage() {
  const t = await getDictionary();
  return (
    <>
      <ClientBrand />
      <StatusCard icon="link" tone="warn" title={t.home.title} text={t.home.text} />
    </>
  );
}
