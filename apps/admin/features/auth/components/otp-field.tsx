"use client";

import { useEffect, useRef, useState } from "react";

import { TextField } from "@/app/components/form/fields";

/** Campo del código de 6 dígitos de la app de autenticación. Solo admite números y toma el foco al montarse. */
export function OtpField() {
  const [code, setCode] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <TextField
      inputRef={ref}
      name="code"
      label="Código"
      required
      requiredMark={false}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      pattern="[0-9]{6}"
      placeholder="000000"
      sizeClassName="h-14 text-center text-2xl tracking-[0.4em]"
      value={code}
      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
    />
  );
}
