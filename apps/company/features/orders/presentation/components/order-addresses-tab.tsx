import { accessFacts } from "../detail-text";
import type { DetailAddress } from "../../domain/detail";
import type { OrdersText } from "../orders-text";
import { AddressBadge, addressKind, card } from "./order-detail-parts";

function AddressSection({ t, address }: { t: OrdersText; address: DetailAddress }) {
  const d = t.detail.addresses;
  const kind = addressKind(address, t.detail.summary);

  return (
    <section aria-label={kind} className={`${card} gap-4`}>
      <span className="flex items-center gap-3">
        <AddressBadge address={address} />
        <span className="flex flex-col">
          <span className="text-[13px] text-muted">{kind}</span>
          <h2 className="font-display text-xl font-extrabold">{address.place}</h2>
        </span>
      </span>

      {address.access ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {accessFacts(address.access, t).map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted">{fact.label}</dt>
              <dd className={`font-bold ${fact.warn ? "text-warn-foreground" : ""}`}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted">{d.unknown}</p>
      )}

      {address.clientNote ? (
        <p className="rounded-[14px] bg-surface-head px-3.5 py-3 text-sm leading-[1.45]">
          <strong>{d.clientNote}</strong> {address.clientNote}
        </p>
      ) : null}
    </section>
  );
}

/** Pestaña Moradas: accesos de cada punto del recorrido (origen, paradas y destino). */
export function OrderAddressesTab({ t, addresses }: { t: OrdersText; addresses: readonly DetailAddress[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
      {addresses.map((address) => (
        <AddressSection key={`${address.role}-${address.stopNumber ?? 0}`} t={t} address={address} />
      ))}
    </div>
  );
}
