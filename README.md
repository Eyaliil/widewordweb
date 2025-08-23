# WideWordWeb - Dating App

A simple single-page dating app built with React and Tailwind CSS.

## Features

- **Top Section**: 
  - Center avatar with heart emoji
  - Left box: "Who you're looking for" with placeholder text
  - Right box: "About you" with placeholder text
- **The Room Section**: 
  - Grid of user avatar placeholders
  - Responsive layout that works on all devices
  - Hover effects on avatars

## Tech Stack

- React 18
- Tailwind CSS
- Responsive design
- No backend or routing - just frontend layout

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

## Project Structure

```
src/
├── App.js          # Main app component
├── index.js        # React entry point
└── index.css       # Tailwind CSS imports
public/
└── index.html      # HTML template
```

## Responsive Design

The app is fully responsive and includes:
- Mobile-first design
- Flexible grid layouts
- Responsive typography
- Touch-friendly interactions

## Customization

You can easily customize:
- Colors by modifying Tailwind classes
- Layout by adjusting the grid and flexbox classes
- Content by updating the placeholder text
- Avatar styles by changing the emoji or styling 