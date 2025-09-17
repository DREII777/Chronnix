export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function readConfig(): SupabaseConfig {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? window?.SB?.url ?? '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? window?.SB?.anon ?? '';

  if (!url || !anonKey) {
    throw new Error('Configuration Supabase manquante. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
  }

  return { url, anonKey };
}

const config = readConfig();

export default config;
