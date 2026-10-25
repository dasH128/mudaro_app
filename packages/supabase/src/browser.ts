import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { readPublicEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = readPublicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
