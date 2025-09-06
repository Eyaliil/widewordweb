# WideWordWeb - Dating App

A modern, well-structured dating app built with React and Tailwind CSS, featuring a clean component architecture.

## Features

- **Multi-step onboarding process** with form validation
- **Avatar selection** with image upload or emoji/initials options
- **Matching system** based on shared interests
- **Real-time chat** with matched users
- **Responsive design** that works on all devices
- **Local storage persistence** for user data
- **Clean component architecture** for maintainability

## Tech Stack

- React 18 with modern hooks
- Tailwind CSS for styling
- Component-based architecture
- Custom hooks for data persistence
- Utility functions for validation
- Responsive design principles

## Project Structure

```
widewordweb/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.js       # App header with progress bar
│   │   ├── Step1.js        # About You form
│   │   ├── Step2.js        # Avatar selection
│   │   ├── Step3.js        # Looking For preferences
│   │   ├── Step4.js        # The Room matching
│   │   └── ChatModal.js    # Chat interface
│   ├── data/               # Static data and constants
│   │   ├── constants.js    # App constants (interests, pronouns, etc.)
│   │   └── mockUsers.js    # Mock user data
│   ├── hooks/              # Custom React hooks
│   │   └── useLocalStorage.js # Local storage management
│   ├── utils/              # Helper functions
│   │   └── validation.js   # Form validation logic
│   ├── App.js              # Main app component (160 lines vs 829 original)
│   ├── index.js            # React entry point
│   └── index.css           # Tailwind CSS imports
├── public/
│   └── index.html          # HTML template
├── package.json
├── tailwind.config.js
└── README.md
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Build for Production

```bash
npm run build
```

## Code Quality Improvements

- **Reduced main App.js from 829 to 160 lines** (80% reduction)
- **Separated concerns** into logical components
- **Reusable validation functions** in utils/
- **Centralized constants** in data/
- **Custom hooks** for data persistence
- **Better maintainability** and readability

## Responsive Design

The app is fully responsive and includes:
- Mobile-first design approach
- Flexible grid layouts
- Responsive typography
- Touch-friendly interactions
- Adaptive component sizing

## Customization

You can easily customize:
- Colors by modifying Tailwind classes
- Layout by adjusting the grid and flexbox classes
- Content by updating the constants in data/
- Avatar styles by changing the emoji or styling
- Validation rules in utils/validation.js 

## Supabase Setup

1. Create a project at https://app.supabase.com
2. Get your Project URL and anon public key from Project Settings → API.
3. Copy `.env.example` to `.env` and fill:

```
REACT_APP_SUPABASE_URL=your-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

4. Install packages:

```
npm install @supabase/supabase-js
```

5. The Supabase client is created in `src/lib/supabaseClient.js`.

### Database schema (SQL)
Create tables in the SQL editor:

```sql
-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamp with time zone default now(),
  name text,
  age int,
  pronouns text,
  city text,
  bio text
);

-- interests (lookup)
create table if not exists interests (
  id bigserial primary key,
  label text unique not null
);

-- user_interests (join)
create table if not exists user_interests (
  user_id uuid references profiles(id) on delete cascade,
  interest_id bigint references interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

-- matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','active','ended')) default 'pending'
);

-- messages
create table if not exists messages (
  id bigserial primary key,
  created_at timestamp with time zone default now(),
  match_id uuid references matches(id) on delete cascade,
  sender uuid references profiles(id) on delete cascade,
  content text not null
);
```

### RLS Policies
Enable RLS and add policies:

```sql
alter table profiles enable row level security;
alter table user_interests enable row level security;
alter table interests enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;

-- Only a user can read/update their profile
create policy "Read own profile" on profiles for select using (auth.uid() = id);
create policy "Update own profile" on profiles for update using (auth.uid() = id);
create policy "Insert own profile" on profiles for insert with check (auth.uid() = id);

-- Interests: read-only for everyone
create policy "Read interests" on interests for select using (true);

-- User interests: only owner can manage
create policy "Manage own interests" on user_interests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Matches: participant-only access
create policy "Read own matches" on matches for select using (auth.uid() in (user_a, user_b));
create policy "Insert with self as participant" on matches for insert with check (auth.uid() in (user_a, user_b));

-- Messages: only participants can read/write
create policy "Read messages in own matches" on messages for select using (
  auth.uid() in (select user_a from matches where id = match_id)
  or auth.uid() in (select user_b from matches where id = match_id)
);
create policy "Send in own matches" on messages for insert with check (
  auth.uid() in (select user_a from matches where id = match_id)
  or auth.uid() in (select user_b from matches where id = match_id)
);
```

### Auth Context
Create a basic auth provider to track the session and user, and gate access to the room. Use `supabase.auth.onAuthStateChange` and load the profile into React context. 