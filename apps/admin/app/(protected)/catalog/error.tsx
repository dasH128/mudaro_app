"use client";

import { useEffect } from "react";

import { PageTitle } from "@/app/components/page-title";
import { Button } from "@/app/components/ui/button";
import { ErrorAlert } from "@/app/components/ui/error-alert";

// En Next 16 la función para reintentar se llama `retry` (antes `reset`).
export default function CatalogError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-4">
      <PageTitle>Catálogo global</PageTitle>
      <ErrorAlert>Não foi possível carregar os dados. Tente novamente.</ErrorAlert>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </div>
  );
}
