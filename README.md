# WideWordWeb - Dating App

A modern dating application built with React, Tailwind CSS, and Supabase, featuring name-based authentication, intelligent matching, and real-time messaging.

## 🚀 Features

- **Name-based Authentication** - Simple login without passwords
- **Intelligent Matching Algorithm** - Bidirectional compatibility scoring
- **Real-time Messaging** - Chat with matched users
- **Profile Management** - Complete user profiles with preferences
- **Notification System** - Persistent notification history
- **Responsive Design** - Modern UI with Tailwind CSS

## 📁 Project Structure

```
widewordweb/
├── src/                    # React application source code
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── messaging/     # Chat and messaging components
│   │   ├── matching/     # Match-related components
│   │   ├── profile/      # Profile management components
│   │   ├── ui/           # UI components (notifications, toasts)
│   │   └── Home/         # Home page components
│   ├── services/          # API services (Supabase)
│   ├── hooks/             # Custom React hooks
│   ├── context/           # React context providers
│   ├── lib/               # External library configurations
│   └── utils/             # Utility functions
├── docs/                  # Project documentation
│   ├── setup/             # Setup guides
│   ├── features/          # Feature documentation
│   └── database/          # Database schemas
├── scripts/               # Development utilities
│   ├── check-database.js  # Database inspection
│   ├── load-sample-data.js # Sample data loader
│   ├── test-db-connection.js # Connection tester
│   └── test-match-creation.js # Matching tester
├── public/                # Static assets
└── build/                 # Production build
```

## 🛠️ Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd widewordweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Supabase credentials to .env
   ```

4. **Set up the database**
   - Follow the [Database Setup Guide](docs/setup/database-setup-guide.md)
   - Use the [Clean Database Schema](docs/database/clean-database-schema.sql)

5. **Start the development server**
   ```bash
   npm start
   ```

## 📚 Documentation

### Setup Guides
- [Supabase Setup](docs/setup/SUPABASE_SETUP.md) - Configure Supabase project
- [Database Setup Guide](docs/setup/database-setup-guide.md) - Database configuration

### Feature Documentation
- [Matching Algorithm Demo](docs/features/MATCHING_ALGORITHM_DEMO.md) - How the matching system works
- [Bidirectional Matching System](docs/features/BIDIRECTIONAL_MATCHING_SYSTEM.md) - Detailed matching logic
- [Matching & Messaging Guide](docs/features/MATCHING_MESSAGING_GUIDE.md) - Complete feature overview
- [Matching Test Guide](docs/features/MATCHING_TEST_GUIDE.md) - Testing the matching system

### Database
- [Clean Database Schema](docs/database/clean-database-schema.sql) - Main database schema
- [Name-based Schema](docs/database/name-based-schema.sql) - Authentication schema
- [Messages Table](docs/database/create-messages-table.sql) - Chat functionality schema

## 🎯 Key Features

### Authentication
- Name-based login (no passwords required)
- User session management
- Profile completion tracking

### Matching System
- Bidirectional compatibility scoring
- Age, gender, and interest-based matching
- Mutual match detection
- Match history tracking

### Messaging
- Real-time chat between matched users
- Message persistence and history
- Read/unread status tracking
- Optimistic UI updates

### Notifications
- Persistent notification history
- Read/unread status management
- Real-time notification updates
- Complete audit trail

## 🏗️ Architecture

### Frontend
- **React** - Component-based UI
- **Tailwind CSS** - Utility-first styling
- **Custom Hooks** - Reusable logic
- **Context API** - State management

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security** - Data protection
- **Real-time subscriptions** - Live updates

### Key Services
- `matchingService.js` - Match creation and management
- `messagingService.js` - Chat functionality
- `userService.js` - User management
- `lookupService.js` - Profile operations

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For specific feature testing, see the [Matching Test Guide](docs/features/MATCHING_TEST_GUIDE.md).

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the [documentation](docs/)
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using React, Tailwind CSS, and Supabase**