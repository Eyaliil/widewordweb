import React from 'react';
import { INTERESTS, PRONOUNS } from '../data/constants';
import { isStep1Valid } from '../utils/validation';

const Step1 = ({ me, setMe, onNext }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Tell us about yourself</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
          <input
            type="text"
            value={me.name}
            onChange={(e) => setMe({...me, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
          <input
            type="number"
            min="18"
            max="99"
            value={me.age}
            onChange={(e) => setMe({...me, age: parseInt(e.target.value) || ''})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="18-99"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pronouns *</label>
          <select
            value={me.pronouns}
            onChange={(e) => setMe({...me, pronouns: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Select pronouns</option>
            {PRONOUNS.map(pronoun => (
              <option key={pronoun} value={pronoun}>{pronoun}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City (optional)</label>
          <input
            type="text"
            value={me.city}
            onChange={(e) => setMe({...me, city: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Enter your city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio * ({me.bio.length}/200)
          </label>
          <textarea
            value={me.bio}
            onChange={(e) => setMe({...me, bio: e.target.value})}
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Interests *</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => {
                  const newInterests = me.interests.includes(interest)
                    ? me.interests.filter(i => i !== interest)
                    : [...me.interests, interest];
                  setMe({...me, interests: newInterests});
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  me.interests.includes(interest)
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

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!isStep1Valid(me)}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Step1; 