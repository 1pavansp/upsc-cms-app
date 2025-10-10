# UPSC CMS App

A comprehensive Content Management System for UPSC exam preparation, built with React, Firebase, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Content Management**: Create and manage articles, current affairs, quizzes, and study materials
- **Admin Dashboard**: Comprehensive admin interface with sidebar navigation
- **Authentication**: Secure admin login with Firebase Authentication
- **Real-time Updates**: Live content updates and notifications
- **Comment System**: Community engagement with comments and likes

### User Experience
- **Responsive Design**: Mobile-first design with glassmorphism effects
- **Dark Mode**: Toggle between light and dark themes
- **Modern UI**: Material-UI components with custom styling
- **Performance Optimized**: Lazy loading, debounced search, and efficient state management

### Technical Features
- **TypeScript Support**: Full TypeScript integration with type safety
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **Error Handling**: Robust error boundaries with retry functionality
- **Custom Hooks**: Reusable hooks for Firebase, localStorage, and debouncing
- **Performance Monitoring**: Built-in performance optimizations

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Material-UI
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Styling**: CSS3, Glassmorphism design
- **Testing**: Jest, React Testing Library
- **TypeScript**: Full TypeScript support
- **Icons**: Lucide React, Material-UI Icons

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upsc-cms-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── Components/           # React components
│   ├── AdminDashboard.jsx
│   ├── AdminLogin.jsx
│   ├── ArticleForm.jsx
│   ├── ArticlePage.jsx
│   ├── CommentSystem.jsx
│   ├── DarkModeToggle.jsx
│   ├── ErrorBoundary.jsx
│   ├── Home.jsx
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useFirestore.js
│   ├── useFirebaseStorage.js
│   ├── useDebounce.js
│   └── useLocalStorage.js
├── utils/                 # Utility functions
│   ├── dateUtils.js
│   └── firebaseUtils.js
├── config/                # Configuration files
├── firebase.js            # Firebase configuration
├── router.jsx             # Application routing
├── App.jsx                # Main App component
└── main.jsx               # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🎨 Design System

The application uses a consistent design system with:

- **Color Palette**: Blue primary, green secondary, amber accent
- **Typography**: Inter font family with multiple weights
- **Spacing**: Consistent spacing scale (0.5rem to 3rem)
- **Border Radius**: 12px standard, 16px large
- **Glassmorphism**: Translucent backgrounds with backdrop blur
- **Dark Mode**: Complete dark theme support

## 🔐 Authentication

The application uses Firebase Authentication for admin access:

- Email/password authentication
- Password reset functionality
- Protected routes for admin dashboard
- Session persistence

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: 768px, 1024px, 1280px
- **Touch Friendly**: Large touch targets and gestures
- **Performance**: Optimized for mobile performance

## 🚀 Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Responsive images with lazy loading
- **Debounced Search**: Reduced API calls
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Analysis**: Built-in bundle size monitoring

## 🐛 Error Handling

- **Error Boundaries**: Catch and handle React errors
- **User Feedback**: Clear error messages and recovery options
- **Development Tools**: Detailed error information in development
- **Retry Logic**: Automatic retry for failed operations

## 📈 Monitoring & Analytics

- **Performance Monitoring**: Built-in performance tracking
- **Error Tracking**: Comprehensive error logging
- **User Analytics**: User behavior tracking
- **Firebase Analytics**: Integrated with Firebase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Recent Updates

### Version 1.0.0
- ✅ Consolidated routing system
- ✅ Added TypeScript support
- ✅ Enhanced error boundaries
- ✅ Added dark mode toggle
- ✅ Created custom hooks
- ✅ Added comprehensive testing
- ✅ Performance optimizations
- ✅ Improved user experience