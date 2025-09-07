import React, { useEffect, useState, useMemo } from 'react';
import { INTERESTS, PRONOUNS } from '../data/constants';
import { isStep1Valid } from '../utils/validation';
import { supabase } from '../lib/supabaseClient';

async function upsertProfile(me) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const payload = {
    id: user.id,
    name: me.name,
    age: me.age || null,
    pronouns: me.pronouns || null,
    city: me.city || null,
    bio: me.bio || null,
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

const Step1 = ({ me, setMe, avatar, setAvatar, onNext, onBack, showBack = true }) => {
  const [originalInterests, setOriginalInterests] = useState(me.interests || []);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Prefill form with existing profile from DB (once on mount) and load user_interests (about me)
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, age, pronouns, city, bio')
          .eq('id', user.id)
          .maybeSingle();
        if (mounted && profile) {
          // Merge only missing fields so we don't overwrite in-progress edits
          setMe(prev => ({
            ...prev,
            name: prev.name || profile.name || '',
            age: prev.age || profile.age || '',
            pronouns: prev.pronouns || profile.pronouns || '',
            city: prev.city || profile.city || '',
            bio: prev.bio || profile.bio || '',
          }));
        }
        // Load my interests from user_interests -> interests(label)
        const { data: uiRows, error: uiErr } = await supabase
          .from('user_interests')
          .select('interest_id, interests(label)')
          .eq('user_id', user.id);
        if (uiErr) throw uiErr;
        const labels = (uiRows || []).map(r => r.interests?.label).filter(Boolean);
        if (mounted && labels) {
          setOriginalInterests(labels);
          setMe(prev => ({ ...prev, interests: prev.interests && prev.interests.length ? prev.interests : labels }));
        }
      } catch (e) {
        if (mounted) setLoadError(e.message || 'Failed to load your profile');
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [setMe]);

  const interestsDirty = useMemo(() => {
    const a = new Set(originalInterests);
    const b = new Set(me.interests || []);
    if (a.size !== b.size) return true;
    for (const v of a) if (!b.has(v)) return true;
    return false;
  }, [originalInterests, me.interests]);

  const saveMyInterests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    const selected = me.interests || [];
    if (!selected.length) throw new Error('Please select at least one interest');

    const toAddLabels = selected.filter(lbl => !originalInterests.includes(lbl));
    const toRemoveLabels = originalInterests.filter(lbl => !selected.includes(lbl));

    if (toAddLabels.length === 0 && toRemoveLabels.length === 0) return; // nothing to do

    const allLabels = Array.from(new Set([...toAddLabels, ...toRemoveLabels]));
    const { data: interestRows, error: selErr } = await supabase
      .from('interests')
      .select('id, label')
      .in('label', allLabels);
    if (selErr) throw selErr;
    const labelToId = new Map((interestRows || []).map(r => [r.label, r.id]));

    // Deletes
    if (toRemoveLabels.length > 0) {
      const removeIds = toRemoveLabels.map(lbl => labelToId.get(lbl)).filter(Boolean);
      if (removeIds.length > 0) {
        const { error: delErr } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id)
          .in('interest_id', removeIds);
        if (delErr) throw delErr;
      }
    }

    // Inserts
    if (toAddLabels.length > 0) {
      const addIds = toAddLabels.map(lbl => labelToId.get(lbl)).filter(Boolean);
      if (addIds.length !== toAddLabels.length) {
        const missing = toAddLabels.filter(lbl => !labelToId.get(lbl));
        if (missing.length) throw new Error(`Interests not found in DB: ${missing.join(', ')}`);
      }
      if (addIds.length > 0) {
        const rows = addIds.map(id => ({ user_id: user.id, interest_id: id }));
        const { error: insErr } = await supabase
          .from('user_interests')
          .insert(rows);
        if (insErr) throw insErr;
      }
    }
    // Update originals
    setOriginalInterests(selected);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      await saveMyInterests();
      await upsertProfile(me);
      onNext();
    } catch (e) {
      alert(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar({ type: 'image', image: ev.target.result, emoji: '', initials: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setAvatar({ type: 'emoji', image: null, emoji, initials: '' });
  };

  const handleInitialsChange = (initials) => {
    setAvatar({ type: 'emoji', image: null, emoji: '', initials: initials.toUpperCase().slice(0, 2) });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tell us about yourself</h1>
      {loadError && (
        <div className="mb-4 px-4 py-2 rounded bg-red-50 text-red-700 text-sm">{loadError}</div>
      )}
      
      <div className="space-y-6">
        {/* Avatar chooser merged here */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input type="file" accept="image/jpg,image/jpeg,image/png" onChange={handleImageUpload} className="hidden" id="image-upload" />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-2">
              <div className="text-4xl">📷</div>
              <div className="text-sm text-gray-600">Upload a photo (JPG/PNG, 5MB)</div>
            </div>
          </label>
          {avatar?.type === 'image' && avatar?.image && (
            <div className="mt-4">
              <img src={avatar.image} alt="Preview" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow" />
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Or choose emoji/initials</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {['💕','😊','🌟','🎭','🎨','🎵','🏃','📚','✈️','🍳'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className={`w-10 h-10 text-xl rounded-full flex items-center justify-center ${
                  avatar?.type === 'emoji' && avatar?.emoji === emoji ? 'bg-pink-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Or use initials</label>
            <input type="text" value={avatar?.initials || ''} onChange={(e) => handleInitialsChange(e.target.value)} maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded text-center text-xl font-bold" placeholder="AB" />
          </div>
          {(avatar?.type === 'emoji' && (avatar?.emoji || avatar?.initials)) && (
            <div className="mt-3 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-4xl border-4 border-white shadow">
                {avatar.initials || avatar.emoji}
              </div>
            </div>
          )}
        </div>

        {/* Profile fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input type="text" value={me.name} onChange={(e) => setMe({...me, name: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Enter your name" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input type="number" min="18" max="99" value={me.age} onChange={(e) => setMe({...me, age: parseInt(e.target.value) || ''})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="18-99" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns *</label>
          <select value={me.pronouns} onChange={(e) => setMe({...me, pronouns: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
            <option value="">Select pronouns</option>
            {PRONOUNS.map(pronoun => (
              <option key={pronoun} value={pronoun}>{pronoun}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City (optional)</label>
          <input type="text" value={me.city} onChange={(e) => setMe({...me, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Enter your city" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio * ({me.bio.length}/200)</label>
          <textarea value={me.bio} onChange={(e) => setMe({...me, bio: e.target.value})} maxLength={200} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" placeholder="Tell us about yourself..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">My Interests *</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => {
                  const newInterests = (me.interests || []).includes(interest)
                    ? (me.interests || []).filter(i => i !== interest)
                    : ([...(me.interests || []), interest]);
                  setMe({...me, interests: newInterests});
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (me.interests || []).includes(interest)
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        {showBack && (
          <button onClick={onBack} className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200">Back to Room</button>
        )}
        <button
          onClick={handleNext}
          disabled={!isStep1Valid(me) || saving}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default Step1; 