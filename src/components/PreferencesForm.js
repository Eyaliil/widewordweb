import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
 
 const PreferencesForm = ({ me, avatar, lookingFor, setLookingFor, onNext, onBack }) => {
   const [selectedInterests, setSelectedInterests] = useState(me.interests || []);
   const [originalInterests, setOriginalInterests] = useState(me.interests || []);
   const [loading, setLoading] = useState(true);
   const [errorMsg, setErrorMsg] = useState('');
   const [saving, setSaving] = useState(false);
   const [interestOptions, setInterestOptions] = useState([]); // labels from DB

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
        const { data, error } = await supabase
          .from('user_search_interests')
          .select('interest_id, interests(label)')
          .eq('user_id', user.id);
        if (error) throw error;
        const labels = (data || []).map(r => r.interests?.label).filter(Boolean);
        if (!mounted) return;
        setSelectedInterests(labels);
        setOriginalInterests(labels);
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

   const isDirty = useMemo(() => {
     const a = new Set(originalInterests);
     const b = new Set(selectedInterests);
     if (a.size !== b.size) return true;
     for (const v of a) if (!b.has(v)) return true;
     return false;
   }, [originalInterests, selectedInterests]);

   const toggleInterest = (interest) => {
     setSelectedInterests(prev => (
       prev.includes(interest)
         ? prev.filter(i => i !== interest)
         : [...prev, interest]
     ));
   };

   const saveInterests = async () => {
     setSaving(true);
     setErrorMsg('');
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Not signed in');

       const toAddLabels = selectedInterests.filter(lbl => !originalInterests.includes(lbl));
       const toRemoveLabels = originalInterests.filter(lbl => !selectedInterests.includes(lbl));

       if (toAddLabels.length === 0 && toRemoveLabels.length === 0) return; // nothing to do

       // Map labels -> ids for adds/removes
       const allLabels = Array.from(new Set([...toAddLabels, ...toRemoveLabels]));
       const { data: interestRows, error: selErr } = await supabase
         .from('interests')
         .select('id, label')
         .in('label', allLabels);
       if (selErr) throw selErr;
       const labelToId = new Map((interestRows || []).map(r => [r.label, r.id]));

       // Deletes (searched interests)
       if (toRemoveLabels.length > 0) {
         const removeIds = toRemoveLabels.map(lbl => labelToId.get(lbl)).filter(Boolean);
         if (removeIds.length > 0) {
           const { error: delErr } = await supabase
             .from('user_search_interests')
             .delete()
             .eq('user_id', user.id)
             .in('interest_id', removeIds);
           if (delErr) throw delErr;
         }
       }

       // Inserts (searched interests)
       if (toAddLabels.length > 0) {
         const addIds = toAddLabels.map(lbl => labelToId.get(lbl)).filter(Boolean);
         if (addIds.length !== toAddLabels.length) {
           const missing = toAddLabels.filter(lbl => !labelToId.get(lbl));
           if (missing.length) throw new Error(`Interests not found in DB: ${missing.join(', ')}`);
         }
         if (addIds.length > 0) {
           const rows = addIds.map(id => ({ user_id: user.id, interest_id: id }));
           const { error: insErr } = await supabase
             .from('user_search_interests')
             .insert(rows);
           if (insErr) throw insErr;
         }
       }

       // Success: update originals
       setOriginalInterests(selectedInterests);
     } catch (e) {
       console.error(e);
       setErrorMsg(e.message || 'Failed to save preferences');
       throw e;
     } finally {
       setSaving(false);
     }
   };
 
   const handleNext = async () => {
     try {
       await saveInterests();
       onNext();
     } catch (_) {}
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
       <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Your Preferences</h1>
       {errorMsg && (
         <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 text-sm">{errorMsg}</div>
       )}
       <div className="space-y-6">
         <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
           <div className="flex flex-wrap gap-2">
            {interestOptions.map(interest => (
               <button
                 key={interest}
                 onClick={() => toggleInterest(interest)}
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
           onClick={handleNext}
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