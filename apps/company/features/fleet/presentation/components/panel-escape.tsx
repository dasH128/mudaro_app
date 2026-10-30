"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Cliente solo para cerrar el panel con Escape (el resto del panel es de servidor).
export function PanelEscape({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push(href, { scroll: false });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [href, router]);

  return null;
}
