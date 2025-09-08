// Validation functions
export const isProfileValid = (me) => {
  return me.name.trim() && 
         me.age >= 18 && me.age <= 99 && 
         me.pronouns && 
         me.bio.trim() && me.bio.length <= 200 && 
         me.interests.length > 0;
};

export const isAvatarValid = (avatar) => {
  return avatar.type && ((avatar.type === 'image' && avatar.image) || (avatar.type === 'emoji' && avatar.emoji));
};

export const isPreferencesValid = (lookingFor) => {
  return lookingFor.genders.length > 0 && 
         lookingFor.interests.length > 0 && 
         lookingFor.vibe;
}; 