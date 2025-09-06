import React from 'react';
import { INTERESTS, GENDERS, VIBES, DEAL_BREAKERS } from '../data/constants';
import { isStep3Valid } from '../utils/validation';
import { supabase } from '../lib/supabaseClient';

const Step3 = ({ me, avatar, lookingFor, setLookingFor, onNext, onBack }) => {
  const saveInterests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');

    if (!me.interests || me.interests.length === 0) {
      throw new Error('Please select at least one interest');
    }

    // Fetch existing interests by label (expects table pre-seeded)
    const { data: interestRows, error: selErr } = await supabase
      .from('interests')
      .select('id, label')
      .in('label', me.interests);
    if (selErr) throw selErr;

    if (!interestRows || interestRows.length === 0) {
      throw new Error('No matching interests found in DB. Seed the interests table.');
    }

    // Warn if some selected labels were not found (likely missing seed rows)
    const foundLabels = new Set(interestRows.map(r => r.label));
    const missing = me.interests.filter(lbl => !foundLabels.has(lbl));
    if (missing.length > 0) {
      throw new Error(`These interests are not set up in DB: ${missing.join(', ')}`);
    }

    const ids = interestRows.map(r => r.id);

    // Replace user_interests rows for this user
    const { error: delErr } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', user.id);
    if (delErr) throw delErr;

    const rows = ids.map(id => ({ user_id: user.id, interest_id: id }));
    const { error: insErr } = await supabase
      .from('user_interests')
      .insert(rows);
    if (insErr) throw insErr;
  };

  const handleNext = async () => {
    try {
      await saveInterests();
      onNext();
    } catch (e) {
      alert(e.message || 'Failed to save preferences');
    }
  };
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Who are you looking for?</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred genders *</label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(gender => (
                <button
                  key={gender}
                  onClick={() => {
                    const newGenders = lookingFor.genders.includes(gender)
                      ? lookingFor.genders.filter(g => g !== gender)
                      : [...lookingFor.genders, gender];
                    setLookingFor({...lookingFor, genders: newGenders});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.genders.includes(gender)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age range: {lookingFor.ageRange[0]} - {lookingFor.ageRange[1]}
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="18"
                max="99"
                value={lookingFor.ageRange[0]}
                onChange={(e) => setLookingFor({
                  ...lookingFor, 
                  ageRange: [parseInt(e.target.value), lookingFor.ageRange[1]]
                })}
                className="flex-1"
              />
              <span className="text-gray-500">to</span>
              <input
                type="range"
                min="18"
                max="99"
                value={lookingFor.ageRange[1]}
                onChange={(e) => setLookingFor({
                  ...lookingFor, 
                  ageRange: [lookingFor.ageRange[0], parseInt(e.target.value)]
                })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => {
                    const newInterests = lookingFor.interests.includes(interest)
                      ? lookingFor.interests.filter(i => i !== interest)
                      : [...lookingFor.interests, interest];
                    setLookingFor({...lookingFor, interests: newInterests});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.interests.includes(interest)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum distance: {lookingFor.distance}km
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={lookingFor.distance}
              onChange={(e) => setLookingFor({...lookingFor, distance: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vibe *</label>
            <div className="flex gap-2">
              {VIBES.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => setLookingFor({...lookingFor, vibe})}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                    lookingFor.vibe === vibe
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal-breakers</label>
            <div className="flex flex-wrap gap-2">
              {DEAL_BREAKERS.map(dealBreaker => (
                <button
                  key={dealBreaker}
                  onClick={() => {
                    const newDealBreakers = lookingFor.dealBreakers.includes(dealBreaker)
                      ? lookingFor.dealBreakers.filter(d => d !== dealBreaker)
                      : [...lookingFor.dealBreakers, dealBreaker];
                    setLookingFor({...lookingFor, dealBreakers: newDealBreakers});
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    lookingFor.dealBreakers.includes(dealBreaker)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {dealBreaker}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card (md+) */}
        <div className="hidden md:block">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About You</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-3xl border-2 border-white shadow-lg">
                  {avatar.type === 'image' && avatar.image ? (
                    <img src={avatar.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    avatar.initials || avatar.emoji
                  )}
                </div>
                <p className="font-medium text-gray-800 mt-2">{me.name}</p>
                <p className="text-sm text-gray-500">{me.age} • {me.pronouns}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">{me.bio}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interests:</p>
                <div className="flex flex-wrap gap-1">
                  {me.interests.map(interest => (
                    <span key={interest} className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isStep3Valid(lookingFor)}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Finish
        </button>
      </div>
    </div>
  );
};

export default Step3; 