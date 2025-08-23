import React from 'react';
import { isStep2Valid } from '../utils/validation';

const Step2 = ({ avatar, setAvatar, onNext, onBack }) => {
  // Handle file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar({
          type: 'image',
          image: e.target.result,
          emoji: '',
          initials: ''
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setAvatar({
      type: 'emoji',
      image: null,
      emoji,
      initials: ''
    });
  };

  // Handle initials input
  const handleInitialsChange = (initials) => {
    setAvatar({
      type: 'emoji',
      image: null,
      emoji: '',
      initials: initials.toUpperCase().slice(0, 2)
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Choose your avatar</h1>
      
      <div className="space-y-8">
        {/* Image Upload Option */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/jpg,image/jpeg,image/png"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="space-y-4">
              <div className="text-4xl">📷</div>
              <div>
                <p className="text-lg font-medium text-gray-700">Upload a photo</p>
                <p className="text-sm text-gray-500">JPG or PNG, max 5MB</p>
              </div>
            </div>
          </label>
          
          {avatar.type === 'image' && avatar.image && (
            <div className="mt-4">
              <img 
                src={avatar.image} 
                alt="Preview" 
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Emoji/Initials Option */}
        <div className="border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Or choose emoji/initials</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {['💕', '😊', '🌟', '🎭', '🎨', '🎵', '🏃', '📚', '✈️', '🍳'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-12 h-12 text-2xl rounded-full flex items-center justify-center transition-colors ${
                      avatar.type === 'emoji' && avatar.emoji === emoji
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or use initials</label>
              <input
                type="text"
                value={avatar.initials}
                onChange={(e) => handleInitialsChange(e.target.value)}
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl font-bold"
                placeholder="AB"
              />
            </div>
          </div>

          {(avatar.type === 'emoji' && (avatar.emoji || avatar.initials)) && (
            <div className="mt-4 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-6xl border-4 border-white shadow-lg">
                {avatar.initials || avatar.emoji}
              </div>
            </div>
          )}
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
          onClick={onNext}
          disabled={!isStep2Valid(avatar)}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Step2; 