// Fake users for testing without authentication
export const fakeUsers = [
  {
    id: 'fake-user-1',
    name: 'Alex Johnson',
    age: 28,
    gender: 'Non-binary',
    pronouns: 'They/Them',
    city: 'San Francisco',
    bio: 'Love hiking, coffee, and good conversations. Looking for someone to explore the city with! Passionate about photography and sustainable living.',
    interests: ['Hiking', 'Coffee', 'Photography', 'Travel', 'Nature', 'Sustainability'],
    avatar: { type: 'emoji', emoji: '🌟', initials: '' }
  },
  {
    id: 'fake-user-2', 
    name: 'Sarah Chen',
    age: 25,
    gender: 'Woman',
    pronouns: 'She/Her',
    city: 'New York',
    bio: 'Artist and yoga instructor. Passionate about sustainable living and creative expression. Love exploring art galleries and trying new cuisines.',
    interests: ['Art', 'Yoga', 'Sustainability', 'Music', 'Food', 'Photography'],
    avatar: { type: 'emoji', emoji: '🎨', initials: '' }
  },
  {
    id: 'fake-user-3',
    name: 'Marcus Rodriguez',
    age: 32,
    gender: 'Man', 
    pronouns: 'He/Him',
    city: 'Austin',
    bio: 'Software engineer by day, musician by night. Love live music and trying new restaurants. Always up for outdoor adventures and tech discussions.',
    interests: ['Music', 'Technology', 'Food', 'Gaming', 'Travel', 'Nature'],
    avatar: { type: 'emoji', emoji: '🎵', initials: '' }
  },
  {
    id: 'fake-user-4',
    name: 'Jordan Kim',
    age: 26,
    gender: 'Woman',
    pronouns: 'She/Her', 
    city: 'Seattle',
    bio: 'Book lover and nature enthusiast. Always up for a good adventure or cozy night in. Love hiking, cooking, and discovering new music.',
    interests: ['Reading', 'Nature', 'Travel', 'Cooking', 'Music', 'Hiking'],
    avatar: { type: 'emoji', emoji: '📚', initials: '' }
  },
  {
    id: 'fake-user-5',
    name: 'Taylor Williams',
    age: 30,
    gender: 'Non-binary',
    pronouns: 'They/Them',
    city: 'Portland',
    bio: 'Fitness enthusiast and dog lover. Looking for someone who shares my active lifestyle. Love outdoor activities, healthy cooking, and weekend adventures.',
    interests: ['Fitness', 'Animals', 'Outdoor Activities', 'Health', 'Cooking', 'Nature'],
    avatar: { type: 'emoji', emoji: '🏃', initials: '' }
  },
  {
    id: 'fake-user-6',
    name: 'Riley Davis',
    age: 27,
    gender: 'Man',
    pronouns: 'He/Him',
    city: 'Denver',
    bio: 'Mountain biker and craft beer enthusiast. Love exploring new trails and breweries. Always looking for adventure partners and good conversation.',
    interests: ['Mountain Biking', 'Craft Beer', 'Adventure', 'Sports', 'Nature', 'Travel'],
    avatar: { type: 'emoji', emoji: '🚵', initials: '' }
  },
  {
    id: 'fake-user-7',
    name: 'Casey Brown',
    age: 24,
    gender: 'Woman',
    pronouns: 'She/Her',
    city: 'Miami',
    bio: 'Dancer and beach lover. Always dancing to the rhythm of life and looking for my perfect partner. Love fitness, fashion, and beach adventures.',
    interests: ['Dancing', 'Beach', 'Fashion', 'Fitness', 'Music', 'Travel'],
    avatar: { type: 'emoji', emoji: '💃', initials: '' }
  },
  {
    id: 'fake-user-8',
    name: 'Morgan Lee',
    age: 29,
    gender: 'Non-binary',
    pronouns: 'They/Them',
    city: 'Chicago',
    bio: 'Writer and coffee shop enthusiast. Love deep conversations and exploring the city. Passionate about literature, art, and discovering hidden gems.',
    interests: ['Writing', 'Coffee', 'Literature', 'City Exploration', 'Art', 'Music'],
    avatar: { type: 'emoji', emoji: '✍️', initials: '' }
  },
  {
    id: 'fake-user-9',
    name: 'Sam Wilson',
    age: 31,
    gender: 'Man',
    pronouns: 'He/Him',
    city: 'San Francisco',
    bio: 'Tech entrepreneur who loves the outdoors. Balance between startup life and weekend adventures. Looking for someone who appreciates both city life and nature.',
    interests: ['Technology', 'Hiking', 'Travel', 'Coffee', 'Nature', 'Adventure'],
    avatar: { type: 'emoji', emoji: '🚀', initials: '' }
  },
  {
    id: 'fake-user-10',
    name: 'Zoe Martinez',
    age: 23,
    gender: 'Woman',
    pronouns: 'She/Her',
    city: 'Austin',
    bio: 'Music producer and foodie. Love discovering new artists and trying different cuisines. Always up for live music and culinary adventures.',
    interests: ['Music', 'Food', 'Art', 'Travel', 'Photography', 'Cooking'],
    avatar: { type: 'emoji', emoji: '🎤', initials: '' }
  }
];

// Generate fake user preferences
export const generateFakePreferences = (userId) => {
  const ageRanges = [[22, 28], [25, 32], [28, 35], [30, 40]];
  const distances = [25, 50, 75, 100];
  const vibes = ['Adventure', 'Romantic', 'Fun', 'Intellectual', 'Creative', 'Chill'];
  
  const randomAgeRange = ageRanges[Math.floor(Math.random() * ageRanges.length)];
  const randomDistance = distances[Math.floor(Math.random() * distances.length)];
  const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
  
  return {
    userId,
    genders: ['Man', 'Woman', 'Non-binary'].slice(0, Math.floor(Math.random() * 3) + 1),
    ageMin: randomAgeRange[0],
    ageMax: randomAgeRange[1], 
    distanceKm: randomDistance,
    relationshipTypes: ['Casual Dating', 'Serious Relationship', 'Friendship'].slice(0, Math.floor(Math.random() * 3) + 1),
    vibe: randomVibe,
    searchInterests: ['Music', 'Travel', 'Art', 'Sports', 'Food', 'Nature', 'Technology', 'Fitness'].slice(0, Math.floor(Math.random() * 5) + 2)
  };
};
