# MyStatus Web App - Mobile-First User Experience

## Overview

This is the user-facing web application for MyStatus, built with a mobile-first approach to provide an app-like experience in the browser. All features from the mobile app have been replicated with a clean, minimal, enterprise-grade UI/UX.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19.2, Tailwind CSS 4
- **Components**: shadcn/ui, Lucide React icons
- **State Management**: React Context API
- **Authentication**: JWT with localStorage persistence
- **API**: RESTful endpoints (shared with mobile app)

## Project Structure

```
admin/src/
├── app/app/                      # User-facing web app (route: /app)
│   ├── layout.tsx               # Main app layout with auth routing
│   ├── page.tsx                 # Root redirect to onboarding
│   │
│   ├── onboarding/              # 4-slide onboarding flow
│   ├── login/                   # Activation key login
│   ├── register/                # Registration with referral code
│   │
│   ├── home/                    # Dashboard with balance & stats
│   ├── discover/                # Browse ads with search & filters
│   ├── earnings/                # Earnings overview & stats
│   ├── profile/                 # User profile & settings
│   │
│   ├── my-shares/               # User's shared ads
│   ├── marketplace/             # Purchase activation keys
│   ├── wallet/                  # Wallet & withdrawals
│   ├── referral/                # Referral network
│   ├── transaction-history/     # All transactions
│   ├── purchased-keys/          # Purchased activation keys
│   ├── edit-profile/            # Edit user profile
│   ├── share-app/               # Share referral code
│   └── support/                 # Help & support
│
├── components/app/              # App-specific components
│   ├── BottomNav.tsx           # Mobile bottom navigation (4 tabs)
│   ├── AppHeader.tsx           # Header with back button & notifications
│   ├── CoinAmount.tsx          # Currency display component
│   └── AdCard.tsx              # Advertisement card component
│
├── contexts/
│   └── AuthContext.tsx         # User authentication context
│
└── app/globals.css             # Global styles with custom animations
```

## Features

### Authentication
- **Onboarding**: 4-slide introduction to the platform
- **Login**: Activation key-based authentication (6-12 characters)
- **Register**: Sign up with name, email, phone, and referral code
- **Auto-redirect**: Authenticated users redirect to home, unauthenticated to onboarding

### Main Screens (Bottom Navigation)

1. **Home** (`/app/home`)
   - Welcome message with user's name
   - Balance card with withdraw & buy keys actions
   - Stats grid: Total shares, Pending, Referrals, This month
   - Featured advertisements
   - 8-Day Challenge banner
   - Ad details modal with share action

2. **Discover** (`/app/discover`)
   - Search bar with real-time filtering
   - Filter chips: All, Instant, High Reward, New
   - Ad cards with image, title, description, reward, verification time
   - Ad details modal with full info & share action

3. **Earnings** (`/app/earnings`)
   - Total earnings display
   - Period stats: This Month, This Week
   - Share status breakdown: Verified, Pending, Rejected
   - Recent activity list
   - Quick actions: My Shares, Withdraw

4. **Profile** (`/app/profile`)
   - Profile header with picture, name, email, status
   - Stats: Balance, Withdrawn, Referrals
   - Activation key display
   - Referral code card with share action
   - Menu sections:
     - Account: Edit Profile, Wallet, Marketplace, Purchased Keys
     - Activity: My Shares, Transaction History, Referral Network
     - More: Share App, Help & Support, Privacy, Terms
   - Logout button

### Additional Screens

- **Wallet** (`/app/wallet`): View balance, withdrawal limits, make withdrawals, key renewal warnings
- **Marketplace** (`/app/marketplace`): Browse & purchase activation key tiers
- **My Shares** (`/app/my-shares`): View all shared ads with status filters, proof images, rejection reasons
- **Referral Network** (`/app/referral`): Referral code, commission breakdown by level, network tree
- **Transaction History** (`/app/transaction-history`): All transactions grouped by date with filters
- **Purchased Keys** (`/app/purchased-keys`): View all purchased activation keys and their status
- **Edit Profile** (`/app/edit-profile`): Update name, email, phone, profile picture
- **Share App** (`/app/share-app`): Share referral code via WhatsApp, Facebook, Twitter, etc.
- **Support** (`/app/support`): Contact options (WhatsApp, Email, Phone) and FAQs

## Design System

### Color Palette
- **Primary**: Emerald (#10b981) & Teal (#14b8a6)
- **Secondary**: Purple (#a855f7) & Pink (#ec4899)
- **Background**: Slate 950/900/800
- **Text**: Slate 100 (primary), Slate 400 (secondary)

### Component Patterns
- **Cards**: Rounded-3xl with backdrop blur, gradient borders
- **Buttons**: Gradient backgrounds (emerald to teal), rounded-xl, active scale animation
- **Inputs**: Slate background, rounded-2xl, emerald focus ring
- **Badges**: Status-based colors with opacity backgrounds
- **Modals**: Slide up from bottom with backdrop blur

### Mobile-First Features
- **Bottom Navigation**: Fixed bottom bar with 4 tabs (Home, Discover, Earnings, Profile)
- **Safe Area Support**: CSS for notched devices
- **Touch Optimization**: No tap highlight, active scale animations
- **Smooth Scrolling**: Custom scrollbar hiding, smooth scroll behavior
- **Responsive**: Max-width 448px (md), centered on larger screens

### Custom Animations
```css
.animate-fade-in       # Fade in with slight upward movement
.animate-slide-up      # Slide up from bottom (modals)
.scrollbar-hide        # Hide scrollbar but keep functionality
```

## Authentication Flow

1. User visits `/app` → redirects to `/app/onboarding`
2. Onboarding → Login (existing users) or Register (new users)
3. Login with activation key → stores JWT token & user in localStorage
4. Register with referral code → auto-login → home
5. Protected routes check auth state → redirect to onboarding if not authenticated
6. Logout → clears localStorage → redirects to login

## API Integration

All screens use the existing API endpoints:

### Authentication
- `POST /api/auth/user/login` - Login with activation key
- `POST /api/auth/user/register` - Register new user

### User
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/wallet` - Get wallet info
- `POST /api/users/withdrawal` - Create withdrawal request
- `GET /api/users/withdrawal` - Get withdrawal requests
- `GET /api/users/transactions` - Get transaction history
- `GET /api/users/referral` - Get referral network data

### Advertisements
- `GET /api/advertisements` - Get all ads
- `POST /api/shares` - Create a share
- `GET /api/shares` - Get user's shares
- `PUT /api/shares/:shareId/verify` - Submit proof

### Marketplace
- `GET /api/marketplace` - Get available key tiers
- `POST /api/marketplace` - Purchase a key
- `GET /api/marketplace/purchased` - Get purchased keys

## Running the App

1. **Development**:
   ```bash
   cd admin
   npm run dev
   ```
   Visit: `http://localhost:3000/app`

2. **Production**:
   ```bash
   npm run build
   npm start
   ```

## Key Differences from Mobile App

✅ **Same**: All features, screens, and functionality
✅ **Enhanced**: Better desktop support with max-width constraint
✅ **Optimized**: Web-specific animations and transitions
✅ **Improved**: Larger clickable areas, better hover states
✅ **Accessible**: Better keyboard navigation support

## Future Enhancements

- [ ] Progressive Web App (PWA) support with offline mode
- [ ] Push notifications for share verifications
- [ ] QR code generation for referral sharing
- [ ] Dark/light mode toggle (currently dark only)
- [ ] Multi-language support
- [ ] Share verification screen with camera/upload
- [ ] MyStatus 8-Day Challenge screen
- [ ] Advanced analytics dashboard
- [ ] In-app chat support

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The app is fully responsive and works on all screen sizes
- Mobile-first design ensures optimal experience on phones
- Desktop users get a centered, mobile-sized view for consistency
- All API endpoints are shared with the mobile app
- JWT tokens are stored in localStorage for persistence
- Session persists across page reloads

## Demo Credentials

For testing, use any valid activation key from the database.

## Support

For issues or questions, contact the development team or refer to the main README.md
