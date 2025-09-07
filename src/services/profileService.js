import { supabase } from '../lib/supabaseClient';

export async function loadPublicProfiles(limit = 20) {
  const { data, error } = await supabase.rpc('public_profiles');
  if (error) throw error;
  return Array.isArray(data) ? data.slice(0, limit) : (data ? [data] : []);
}
