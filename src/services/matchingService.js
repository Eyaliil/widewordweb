import { supabase } from '../lib/supabaseClient';

export async function findMatchRPC() {
  const { data, error } = await supabase.rpc('find_match');
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id || null;
}

export function pickRandomExcluding(users, excludeId) {
  const pool = (users || []).filter(u => u.id !== excludeId);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
