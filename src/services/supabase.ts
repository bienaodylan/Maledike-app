/**
 * MALÉDIKÉ PARTY — Client Supabase (authentification, profils, billets)
 *
 * L'URL du projet et la clé "publishable" sont publiques par conception : elles sont
 * faites pour tourner dans le navigateur. La sécurité repose sur les politiques RLS
 * de la base. Ne JAMAIS mettre ici la clé "service_role" ni une clé secrète.
 * Les variables VITE_* permettent de surcharger ces valeurs (autre projet Supabase).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://xwzuubyebnnziuzdudzu.supabase.co';

const SUPABASE_PUBLISHABLE_KEY: string =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  'sb_publishable_u0oEwFsYLKCJqhGLjK2u7g_voR_dsqP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
