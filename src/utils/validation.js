// Validation functions
export const isStep1Valid = (me) => {
  return me.name.trim() && 
         me.age >= 18 && me.age <= 99 && 
         me.pronouns && 
         me.bio.trim() && me.bio.length <= 200 && 
         me.interests.length > 0;
};

export const isStep2Valid = (avatar) => {
  return avatar.type && ((avatar.type === 'image' && avatar.image) || (avatar.type === 'emoji' && avatar.emoji));
};

export const isStep3Valid = (lookingFor) => {
  return lookingFor.genders.length > 0 && 
         lookingFor.interests.length > 0 && 
         lookingFor.vibe;
}; 