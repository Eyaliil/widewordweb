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