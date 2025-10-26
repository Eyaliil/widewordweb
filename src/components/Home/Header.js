import React from 'react';
import { RiMessage3Line, RiLogoutBoxRLine, RiEditLine, RiUserLine, RiHeart3Line } from 'react-icons/ri';

const Header = ({ 
  currentUser, 
  onLogout,
  onEditProfile,
  onNavigateToChat
}) => {
  // Get avatar display
  const getAvatarDisplay = () => {
    if (currentUser?.avatar) {
      if (currentUser.avatar.type === 'emoji') {
        return <span className="text-xl">{currentUser.avatar.emoji}</span>;
      } else if (currentUser.avatar.initials) {
        return <span className="text-base font-medium text-[#40002B]">{currentUser.avatar.initials}</span>;
      } else if (currentUser.avatar.image) {
        return <img src={currentUser.avatar.image} alt={currentUser.name} className="w-full h-full object-cover" />;
      }
    }
    return <RiUserLine className="text-xl text-[#40002B]" />;
  };

  return (
    <div className="bg-white border-b border-[#F9E6CA] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo/User info */}
          <div className="flex items-center space-x-4">
            {/* Logo/Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#7B002C] to-[#40002B] rounded-full flex items-center justify-center">
              <RiHeart3Line className="text-white text-lg" />
            </div>
            
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#F9E6CA] rounded-full flex items-center justify-center overflow-hidden">
                {getAvatarDisplay()}
              </div>
              <div>
                <h1 className="text-base font-medium text-[#40002B]">{currentUser?.name || 'User'}</h1>
              </div>
              <button
                onClick={onEditProfile}
                className="p-1.5 text-[#8B6E58] hover:text-[#40002B] hover:bg-[#F9E6CA] rounded-lg transition-colors duration-200"
                title="Edit profile"
              >
                <RiEditLine className="text-lg" />
              </button>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Messages button */}
            <button
              onClick={onNavigateToChat}
              className="px-4 py-2 bg-[#7B002C] text-white rounded-lg hover:bg-[#40002B] transition-colors duration-250 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <RiMessage3Line className="text-base" />
              <span className="hidden sm:inline">Messages</span>
            </button>
            
            {/* Logout button */}
            <button
              onClick={onLogout}
              className="px-3 py-2 text-[#8B6E58] hover:text-[#40002B] hover:bg-[#F9E6CA] rounded-lg transition-colors duration-200"
              title="Logout"
            >
              <RiLogoutBoxRLine className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
