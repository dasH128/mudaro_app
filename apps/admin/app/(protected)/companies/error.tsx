"use client";

import { useEffect } from "react";

import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { ErrorAlert } from "@/app/components/ui/error-alert";

// En Next 16 la función para reintentar se llama `retry` (antes `reset`).
export default function CompaniesError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // En producción el mensaje llega genérico; `digest` sirve para buscar el error en los logs del servidor.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col items-start gap-4">
      <PageTitle>Empresas do piloto</PageTitle>
      <ErrorAlert>Não foi possível carregar os dados. Tente novamente.</ErrorAlert>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </div>
  );
}
