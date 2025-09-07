import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
 
 const PreferencesForm = ({ me, avatar, lookingFor, setLookingFor, onNext, onBack }) => {
   // Interests (searched)
   const [selectedInterests, setSelectedInterests] = useState([]);
   const [originalInterests, setOriginalInterests] = useState([]);
   const [interestOptions, setInterestOptions] = useState([]); // labels from DB
 
   // Profile-level searched prefs
   const [profilePrefs, setProfilePrefs] = useState({
     genders: [],
     ageMin: 25,
     ageMax: 35,
     distanceKm: 50,
     relationshipTypes: [],
     smokingPref: '', // 'yes' | 'no' | 'sometimes' | ''
     drinkingPref: '',
     languages: [],
     vibe: ''
   });
   const [originalProfile, setOriginalProfile] = useState(profilePrefs);

   const [loading, setLoading] = useState(true);
   const [errorMsg, setErrorMsg] = useState('');
   const [saving, setSaving] = useState(false);

   const GENDER_OPTIONS = ['woman', 'man', 'non-binary', 'other'];
   const RELATIONSHIP_OPTIONS = ['serious', 'casual', 'friendship'];
   const SMOKING_OPTIONS = ['yes', 'no', 'sometimes'];
   const DRINKING_OPTIONS = ['yes', 'no', 'sometimes'];
   const LANGUAGE_OPTIONS = ['English', 'French', 'German', 'Spanish', 'Arabic'];
 
   useEffect(() => {
     let mounted = true;
     const loadData = async () => {
       try {
         // Load available interests from DB
         const { data: optRows, error: optErr } = await supabase
           .from('interests')
           .select('label')
           .order('label', { ascending: true });
         if (optErr) throw optErr;
         const opts = (optRows || []).map(r => r.label);
         if (mounted) setInterestOptions(opts);

         const { data: { user } } = await supabase.auth.getUser();
         if (!user) { setLoading(false); return; }

         // LOAD searched interests
         const { data: siRows, error: siErr } = await supabase
           .from('user_search_interests')
           .select('interest_id, interests(label)')
           .eq('user_id', user.id);
         if (siErr) throw siErr;
         const labels = (siRows || []).map(r => r.interests?.label).filter(Boolean);
         if (mounted) {
           setSelectedInterests(labels);
           setOriginalInterests(labels);
         }

         // LOAD searched profile
         const { data: spRow, error: spErr } = await supabase
           .from('user_search_profile')
           .select('genders, age_min, age_max, distance_km, relationship_types, smoking_pref, drinking_pref, languages, vibe')
           .eq('user_id', user.id)
           .maybeSingle();
         if (spErr) throw spErr;
         const loaded = spRow ? {
           genders: spRow.genders || [],
           ageMin: spRow.age_min ?? 25,
           ageMax: spRow.age_max ?? 35,
           distanceKm: spRow.distance_km ?? 50,
           relationshipTypes: spRow.relationship_types || [],
           smokingPref: spRow.smoking_pref || '',
           drinkingPref: spRow.drinking_pref || '',
           languages: spRow.languages || [],
           vibe: spRow.vibe || ''
         } : { ...profilePrefs };
         if (mounted) {
           setProfilePrefs(loaded);
           setOriginalProfile(loaded);
         }
       } catch (e) {
         console.error(e);
         setErrorMsg(e.message || 'Failed to load your preferences');
       } finally {
         if (mounted) setLoading(false);
       }
     };
     loadData();
     return () => { mounted = false; };
   }, []);

   const arraysEqual = (a, b) => {
     if (!Array.isArray(a) || !Array.isArray(b)) return false;
     if (a.length !== b.length) return false;
     const as = [...a].sort();
     const bs = [...b].sort();
     return as.every((v, i) => v === bs[i]);
   };

   const profileDirty = useMemo(() => {
     return !arraysEqual(profilePrefs.genders, originalProfile.genders)
       || profilePrefs.ageMin !== originalProfile.ageMin
       || profilePrefs.ageMax !== originalProfile.ageMax
       || profilePrefs.distanceKm !== originalProfile.distanceKm
       || !arraysEqual(profilePrefs.relationshipTypes, originalProfile.relationshipTypes)
       || profilePrefs.smokingPref !== originalProfile.smokingPref
       || profilePrefs.drinkingPref !== originalProfile.drinkingPref
       || !arraysEqual(profilePrefs.languages, originalProfile.languages)
       || profilePrefs.vibe !== originalProfile.vibe;
   }, [profilePrefs, originalProfile]);

   const interestsDirty = useMemo(() => {
     const a = new Set(originalInterests);
     const b = new Set(selectedInterests);
     if (a.size !== b.size) return true;
     for (const v of a) if (!b.has(v)) return true;
     return false;
   }, [originalInterests, selectedInterests]);

   const isDirty = profileDirty || interestsDirty;

   const toggleValue = (key, value) => {
     setProfilePrefs(prev => {
       const current = prev[key];
       if (!Array.isArray(current)) return prev;
       const exists = current.includes(value);
       const next = exists ? current.filter(v => v !== value) : [...current, value];
       return { ...prev, [key]: next };
     });
   };

   const saveInterests = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('Not signed in');
     const toAddLabels = selectedInterests.filter(lbl => !originalInterests.includes(lbl));
     const toRemoveLabels = originalInterests.filter(lbl => !selectedInterests.includes(lbl));
     if (toAddLabels.length === 0 && toRemoveLabels.length === 0) return;
     const allLabels = Array.from(new Set([...toAddLabels, ...toRemoveLabels]));
     const { data: interestRows, error: selErr } = await supabase
       .from('interests')
       .select('id, label')
       .in('label', allLabels);
     if (selErr) throw selErr;
     const map = new Map((interestRows || []).map(r => [r.label, r.id]));
     if (toRemoveLabels.length > 0) {
       const removeIds = toRemoveLabels.map(lbl => map.get(lbl)).filter(Boolean);
       if (removeIds.length) {
         const { error } = await supabase
           .from('user_search_interests')
           .delete()
           .in('interest_id', removeIds)
           .eq('user_id', user.id);
         if (error) throw error;
       }
     }
     if (toAddLabels.length > 0) {
       const addIds = toAddLabels.map(lbl => map.get(lbl)).filter(Boolean);
       if (addIds.length !== toAddLabels.length) {
         const missing = toAddLabels.filter(lbl => !map.get(lbl));
         if (missing.length) throw new Error(`Interests not found in DB: ${missing.join(', ')}`);
       }
       if (addIds.length) {
         const rows = addIds.map(id => ({ user_id: user.id, interest_id: id }));
         const { error } = await supabase
           .from('user_search_interests')
           .insert(rows);
         if (error) throw error;
       }
     }
     setOriginalInterests(selectedInterests);
   };

   const saveProfilePrefs = async () => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('Not signed in');
     const payload = {
       user_id: user.id,
       genders: profilePrefs.genders,
       age_min: profilePrefs.ageMin,
       age_max: profilePrefs.ageMax,
       distance_km: profilePrefs.distanceKm,
       relationship_types: profilePrefs.relationshipTypes,
       smoking_pref: profilePrefs.smokingPref || null,
       drinking_pref: profilePrefs.drinkingPref || null,
       languages: profilePrefs.languages,
       vibe: profilePrefs.vibe || null
     };
     const { error } = await supabase.from('user_search_profile').upsert(payload, { onConflict: 'user_id' });
     if (error) throw error;
     setOriginalProfile({ ...profilePrefs });
   };
 
   const handleNext = async () => {
     setSaving(true);
     setErrorMsg('');
     try {
       if (interestsDirty) await saveInterests();
       if (profileDirty) await saveProfilePrefs();
       onNext();
     } catch (e) {
       setErrorMsg(e.message || 'Failed to save preferences');
     } finally {
       setSaving(false);
     }
   };

   if (loading) {
     return (
       <div className="max-w-2xl mx-auto">
         <div className="text-center text-gray-600">Loading your preferences...</div>
       </div>
     );
   }

   return (
     <div className="max-w-2xl mx-auto">
       <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Who I'm looking for</h1>
       {errorMsg && (
         <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>
       )}

       <div className="space-y-6">
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Genders</label>
           <div className="flex flex-wrap gap-2">
             {GENDER_OPTIONS.map(opt => (
               <button
                 key={opt}
                 onClick={() => toggleValue('genders', opt)}
                 className={`px-3 py-1 rounded-full text-sm ${profilePrefs.genders.includes(opt) ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
               >{opt}</button>
             ))}
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Age min</label>
             <input type="number" min="18" max="99" value={profilePrefs.ageMin} onChange={e => setProfilePrefs(p => ({ ...p, ageMin: parseInt(e.target.value)||18 }))} className="w-full px-3 py-2 border rounded" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Age max</label>
             <input type="number" min={profilePrefs.ageMin} max="99" value={profilePrefs.ageMax} onChange={e => setProfilePrefs(p => ({ ...p, ageMax: parseInt(e.target.value)||p.ageMin }))} className="w-full px-3 py-2 border rounded" />
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Max distance (km)</label>
           <input type="number" min="0" value={profilePrefs.distanceKm} onChange={e => setProfilePrefs(p => ({ ...p, distanceKm: Math.max(0, parseInt(e.target.value)||0) }))} className="w-full px-3 py-2 border rounded" />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Relationship type</label>
           <div className="flex flex-wrap gap-2">
             {RELATIONSHIP_OPTIONS.map(opt => (
               <button key={opt} onClick={() => toggleValue('relationshipTypes', opt)} className={`px-3 py-1 rounded-full text-sm ${profilePrefs.relationshipTypes.includes(opt) ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{opt}</button>
             ))}
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
             <div className="flex gap-2">
               {SMOKING_OPTIONS.map(opt => (
                 <label key={opt} className="flex items-center gap-1 text-sm text-gray-700">
                   <input type="radio" name="smoking" checked={profilePrefs.smokingPref === opt} onChange={() => setProfilePrefs(p => ({ ...p, smokingPref: opt }))} /> {opt}
                 </label>
               ))}
             </div>
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
             <div className="flex gap-2">
               {DRINKING_OPTIONS.map(opt => (
                 <label key={opt} className="flex items-center gap-1 text-sm text-gray-700">
                   <input type="radio" name="drinking" checked={profilePrefs.drinkingPref === opt} onChange={() => setProfilePrefs(p => ({ ...p, drinkingPref: opt }))} /> {opt}
                 </label>
               ))}
             </div>
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
           <div className="flex flex-wrap gap-2">
             {LANGUAGE_OPTIONS.map(opt => (
               <button key={opt} onClick={() => toggleValue('languages', opt)} className={`px-3 py-1 rounded-full text-sm ${profilePrefs.languages.includes(opt) ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{opt}</button>
             ))}
           </div>
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Vibe</label>
           <textarea value={profilePrefs.vibe} onChange={e => setProfilePrefs(p => ({ ...p, vibe: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded" placeholder="Describe the vibe you're looking for..." />
         </div>

         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
           <div className="flex flex-wrap gap-2">
             {interestOptions.map(interest => (
               <button
                 key={interest}
                 onClick={() => setSelectedInterests(prev => (prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]))}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                   selectedInterests.includes(interest)
                     ? 'bg-pink-500 text-white'
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 {interest}
               </button>
             ))}
             {interestOptions.length === 0 && (
               <span className="text-sm text-gray-500">No interests available. Seed the interests table.</span>
             )}
           </div>
         </div>
       </div>

       <div className="mt-8 flex justify-between">
         <button onClick={onBack} className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200">Back</button>
         <button
           onClick={async () => { await handleNext(); }}
           disabled={!isDirty || saving}
           className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 ${
             (!isDirty || saving)
               ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
               : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600'
           }`}
         >
           {saving ? 'Saving...' : 'Save'}
         </button>
       </div>
     </div>
   );
 };
 
 export default PreferencesForm; 