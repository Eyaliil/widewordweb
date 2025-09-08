import { supabase } from '../lib/supabaseClient';

async function fetchLabels(table) {
  try {
    const { data, error } = await supabase.from(table).select('label').order('label', { ascending: true });
    if (error) throw error;
    return (data || []).map(r => r.label);
  } catch (e) {
    console.warn(`Failed to load ${table}:`, e?.message || e);
    return [];
  }
}

export const getInterests = () => fetchLabels('interests');
export const getPronouns = () => fetchLabels('pronouns');
export const getGenders = () => fetchLabels('genders');
export const getRelationshipTypes = () => fetchLabels('relationship_types');
export const getSmokingOptions = () => fetchLabels('smoking_options');
export const getDrinkingOptions = () => fetchLabels('drinking_options');
export const getLanguages = () => fetchLabels('languages');
export const getVibes = () => fetchLabels('vibes');
export const getDealBreakers = () => fetchLabels('deal_breakers');
