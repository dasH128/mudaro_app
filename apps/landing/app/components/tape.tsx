// Cinta gráfica de marca (DESIGN.md §7): extremo izquierdo dentado y derecho en punta de flecha.
// Máximo una por pantalla; se usa solo como separador del hero.
const LEFT_TEETH = "0% 0%, 1.2% 12%, 0% 25%, 1.2% 37%, 0% 50%, 1.2% 62%, 0% 75%, 1.2% 87%, 0% 100%";

export function Tape() {
  const items = Array.from({ length: 24 });
  return (
    <div aria-hidden="true" className="relative py-4">
      <div
        className="overflow-hidden bg-primary text-primary-foreground"
        style={{ clipPath: `polygon(${LEFT_TEETH}, 97% 100%, 100% 50%, 97% 0%)` }}
      >
        <div className="tape-track flex w-max whitespace-nowrap py-2.5">
          {items.map((_, i) => (
            <span key={i} className="font-display px-6 text-xl font-extrabold tracking-tight">
              MUDARO ›
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
