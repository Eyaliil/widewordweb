import React from 'react';

const ProfileEditPage = ({ currentUser, onEditProfile, onEditPreferences, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="text-6xl mb-4">✏️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Edit Your Profile</h1>
          <p className="text-gray-600">Choose what you'd like to update</p>
        </div>

        {/* Edit Options */}
        <div className="space-y-4">
          {/* Edit Profile Information */}
          <button
            onClick={onEditProfile}
            className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                👤
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Profile Information</h3>
                <p className="text-gray-600 text-sm">Update your name, age, bio, and personal details</p>
                <div className="mt-2 text-xs text-gray-500">
                  Name • Age • Bio • Gender • Pronouns • City
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Edit Preferences */}
          <button
            onClick={onEditPreferences}
            className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-2xl">
                ⚙️
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Preferences & Interests</h3>
                <p className="text-gray-600 text-sm">Update your interests and matching preferences</p>
                <div className="mt-2 text-xs text-gray-500">
                  Interests • Hobbies • Matching Criteria • Age Range
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* User Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-sm">
              👤
            </div>
            <span className="text-sm text-gray-600">Currently editing: <strong>{currentUser?.name}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
