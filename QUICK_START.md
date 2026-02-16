# MyStatus Web App - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd admin
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Web App
Open your browser and navigate to:
```
http://localhost:3000/app
```

## 📱 Testing the App

### Create a Test Account
1. Visit `http://localhost:3000/app`
2. Click through the onboarding slides (or click "Skip")
3. Click "Register" on the login page
4. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Phone: 1234567890
   - Referral Code: (get from existing user or admin)
5. Submit to create account

### Login with Activation Key
1. Get an activation key from the admin panel or database
2. Enter the key (6-12 characters, auto-uppercase)
3. Login to access the app

## 📍 Routes Overview

### Public Routes (No Auth Required)
- `/app` - Redirects to onboarding
- `/app/onboarding` - 4-slide onboarding
- `/app/login` - Activation key login
- `/app/register` - Registration

### Protected Routes (Auth Required)
All routes under `/app/` except the above require authentication.

#### Main Tabs (Bottom Navigation)
- `/app/home` - Dashboard
- `/app/discover` - Browse ads
- `/app/earnings` - Earnings & stats
- `/app/profile` - User profile

#### Additional Screens
- `/app/wallet` - Wallet & withdrawals
- `/app/marketplace` - Purchase keys
- `/app/my-shares` - Shared ads
- `/app/referral` - Referral network
- `/app/transaction-history` - Transactions
- `/app/purchased-keys` - Purchased keys
- `/app/edit-profile` - Edit profile
- `/app/share-app` - Share referral code
- `/app/mystatus-challenge` - 8-Day challenge
- `/app/support` - Help & support

## 🎨 Design Features

### Mobile-First
- Optimized for mobile devices (320px - 480px)
- Max-width 448px (md) centered on desktop
- Touch-optimized interactions
- Bottom navigation for easy thumb access

### Modern UI/UX
- Dark theme with emerald/teal accents
- Gradient backgrounds and borders
- Smooth animations (fade-in, slide-up)
- Backdrop blur effects
- Card-based layouts
- Status badges with color coding

### Responsive
- Works on all screen sizes
- Safe area support for notched devices
- Hidden scrollbars (but functional)
- Active scale animations on buttons
- Hover states for desktop

## 🔐 Authentication Flow

```
Visit /app
    ↓
Redirects to /app/onboarding
    ↓
Click "Let's Get Started"
    ↓
/app/login
    ↓
Login (existing) or Register (new)
    ↓
Success → Redirects to /app/home
    ↓
JWT token stored in localStorage
    ↓
User persists across page reloads
```

## 📦 Key Components

### AuthContext (`src/contexts/AuthContext.tsx`)
- Manages user authentication state
- Provides: `user`, `token`, `login()`, `register()`, `logout()`, `updateUser()`
- Persists auth in localStorage

### BottomNav (`src/components/app/BottomNav.tsx`)
- Fixed bottom navigation bar
- 4 tabs: Home, Discover, Earnings, Profile
- Active state highlighting
- Icon + label design

### AppHeader (`src/components/app/AppHeader.tsx`)
- Sticky header component
- Back button, title, notifications
- Customizable right action

### CoinAmount (`src/components/app/CoinAmount.tsx`)
- Currency display with coin icon
- Multiple sizes: sm, md, lg, xl
- Formatted Indian Rupee amounts

### AdCard (`src/components/app/AdCard.tsx`)
- Advertisement card component
- Image, title, description, reward
- Verification period badge
- Click handler for modal

## 🔧 Customization

### Colors
Edit `src/app/globals.css` to change the color scheme. Current primary colors:
- Emerald: #10b981
- Teal: #14b8a6
- Purple: #a855f7
- Pink: #ec4899

### Layout
Edit `src/app/app/layout.tsx` to modify:
- Auth routing logic
- Loading states
- Bottom navigation visibility

### Bottom Nav Items
Edit `src/components/app/BottomNav.tsx` to add/remove tabs or change icons.

## 🐛 Debugging

### Check Auth State
Open browser console:
```javascript
console.log(localStorage.getItem('userToken'))
console.log(localStorage.getItem('user'))
```

### Clear Auth
```javascript
localStorage.removeItem('userToken')
localStorage.removeItem('user')
// Reload page
```

### API Errors
All API calls are logged to console. Check Network tab for failed requests.

## 📱 Mobile Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro, Pixel 5, etc.
4. Test touch interactions

### Real Device Testing
1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access from phone: `http://YOUR_IP:3000/app`
3. Make sure phone is on same WiFi network

## 🚢 Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables
Create `.env.local`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

## 📊 Performance

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Optimization Tips
- Images are lazy loaded
- Code splitting with Next.js
- Minimal dependencies
- Efficient re-renders with React Context

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Follow existing code style
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

## 📞 Support

For issues or questions:
- Check WEB_APP_README.md for detailed documentation
- Review existing code for patterns
- Check browser console for errors
- Test API endpoints separately

## ✅ Checklist Before Launch

- [ ] Test all authentication flows
- [ ] Verify all API integrations
- [ ] Test on multiple devices/browsers
- [ ] Check responsive design
- [ ] Verify all routes work
- [ ] Test error handling
- [ ] Review security (HTTPS, CSP, etc.)
- [ ] Optimize images and assets
- [ ] Set up analytics
- [ ] Configure monitoring

---

**Happy Coding!** 🎉

For detailed documentation, see [WEB_APP_README.md](./WEB_APP_README.md)
