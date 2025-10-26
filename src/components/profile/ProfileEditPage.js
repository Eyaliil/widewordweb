import React from 'react';
import { RiUserLine, RiSettingsLine, RiArrowLeftLine } from 'react-icons/ri';

const ProfileEditPage = ({ currentUser, onEditProfile, onEditPreferences, onBack }) => {
  return (
    <div className="min-h-screen bg-[#FBEEDA] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-white hover:bg-[#F9E6CA] text-[#40002B] rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto border border-[#F9E6CA]"
          >
            <RiArrowLeftLine className="text-lg" />
            <span>Back</span>
          </button>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full mb-6">
            <RiUserLine className="text-4xl text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-[#40002B] mb-2">Edit Your Profile</h1>
          <p className="text-[#8B6E58]">Choose what you'd like to update</p>
        </div>

        {/* Edit Options */}
        <div className="space-y-4">
          {/* Edit Profile Information */}
          <button
            onClick={onEditProfile}
            className="w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-250 border border-[#F9E6CA] hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#F9E6CA] rounded-xl flex items-center justify-center">
                <RiUserLine className="text-3xl text-[#40002B]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-[#40002B] mb-1">Profile Information</h3>
                <p className="text-[#8B6E58] text-sm">Update your name, age, bio, and personal details</p>
                <div className="mt-2 text-xs text-[#8B6E58]">
                  Name • Age • Bio • Gender • Pronouns • City
                </div>
              </div>
              <div className="text-[#8B6E58]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Edit Preferences */}
          <button
            onClick={onEditPreferences}
            className="w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-250 border border-[#F9E6CA] hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#F9E6CA] rounded-xl flex items-center justify-center">
                <RiSettingsLine className="text-3xl text-[#40002B]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-[#40002B] mb-1">Preferences & Interests</h3>
                <p className="text-[#8B6E58] text-sm">Update your interests and matching preferences</p>
                <div className="mt-2 text-xs text-[#8B6E58]">
                  Interests • Hobbies • Matching Criteria • Age Range
                </div>
              </div>
              <div className="text-[#8B6E58]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* User Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border border-[#F9E6CA]">
            <div className="w-8 h-8 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full flex items-center justify-center">
              <RiUserLine className="text-sm text-white" />
            </div>
            <span className="text-sm text-[#8B6E58]">Currently editing: <strong className="text-[#40002B]">{currentUser?.name}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
