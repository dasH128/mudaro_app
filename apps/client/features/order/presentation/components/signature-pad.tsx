"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

/** Lo que la página pide a la firma al aceptar. */
export type SignatureHandle = {
  /** PNG en data URL, o `null` si no hay ningún trazo. */
  toPng: () => string | null;
};

type Props = {
  /** Etiqueta accesible del área de firma. */
  label: string;
  describedBy?: string;
  clearLabel: string;
  /** La firma se lee al aceptar (no al soltar el puntero, que no siempre llega). */
  handle: Ref<SignatureHandle>;
};

// RF-43: firma dibujada con el dedo o el ratón (eventos de puntero). Se guarda como PNG con fondo blanco, el formato
// que admite el bucket `signatures` (P6). La resolución se limita para no pasar de 256 KB.
export function SignaturePad({ label, describedBy, clearLabel, handle }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  const reset = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Colores fijos a propósito (excepción a los tokens): la firma es un documento, papel blanco y tinta oscura, sea
    // cual sea el tema de la pantalla.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    context.lineWidth = 2.2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1c2142";
    hasInk.current = false;
  };

  useEffect(reset, []);

  useImperativeHandle(handle, () => ({
    toPng: () => (hasInk.current ? (canvasRef.current?.toDataURL("image/png") ?? null) : null),
  }));

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        aria-describedby={describedBy}
        className="h-44 w-full touch-none rounded-xl border-2 border-dashed border-field-border bg-white"
        onPointerDown={(event) => {
          const context = canvasRef.current?.getContext("2d");
          if (!context) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          const { x, y } = point(event);
          context.beginPath();
          context.moveTo(x, y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const context = canvasRef.current?.getContext("2d");
          if (!context) return;
          const { x, y } = point(event);
          context.lineTo(x, y);
          context.stroke();
          hasInk.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerLeave={() => {
          drawing.current = false;
        }}
      />
      <button
        type="button"
        onClick={reset}
        className="self-start text-sm font-bold underline print:hidden"
      >
        {clearLabel}
      </button>
    </div>
  );
}
