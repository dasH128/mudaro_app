import type { ClientSuggestion } from "../domain/types";

// Datos de ejemplo de clientes. Se sustituyen por consultas a Supabase (RLS por company_id, RNF-01).
// Para probar la sugerencia por teléfono (RF-14): 912 345 821 (Ana) o 916 667 777 (Rui).

export function mockClients(today: string): readonly (ClientSuggestion & { phone: string })[] {
  return [
    {
      id: "client-ana-ribeiro",
      phone: "+351912345821",
      name: "Ana Ribeiro",
      type: "private",
      email: "ana.ribeiro@exemplo.pt",
      orderCount: 1,
      lastOrder: { id: "MD-0819", completedOn: today },
    },
    {
      id: "client-rui-fonseca",
      phone: "+351916667777",
      name: "Rui Fonseca",
      type: "private",
      email: null,
      orderCount: 0,
      lastOrder: null,
    },
  ];
}
