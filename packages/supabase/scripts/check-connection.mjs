const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en apps/admin/.env.local");
  process.exit(1);
}

const base = url.replace(/\/$/, "");

// /auth/v1/settings responde 200 solo con una clave válida del proyecto (401 si no lo es).
const response = await fetch(`${base}/auth/v1/settings`, {
  headers: { apikey: publishableKey },
});

if (!response.ok) {
  console.error(`Auth respondió ${response.status}: ${await response.text()}`);
  console.error("La conexión falló. Revisa la URL y la clave publicable del mismo proyecto.");
  process.exit(1);
}

console.log("Conexión correcta: la URL y la clave publicable son válidas.");
