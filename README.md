# OurStreet - Civic Issue Reporting & Tracking Platform

A modern, transparent platform for citizens to report civic issues, track their resolution, and foster collaboration between communities and local authorities.

Live Link: https://nitgoahackathon1.vercel.app/

![OurStreet Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [AI Features](#ai-features)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

**OurStreet** is a comprehensive civic engagement platform that enables citizens to:
- Report local issues (potholes, broken streetlights, garbage, water leaks, etc.)
- Track issue resolution progress in real-time
- View issues on an interactive map
- Access transparent analytics and impact reports
- Collaborate with municipal authorities

### The Problem We Solve

Urban citizens face everyday civic issues but lack accessible and transparent reporting systems. Even when complaints are registered, citizens rarely receive updates, leading to:
- Low civic engagement
- Duplicate reports
- Lack of accountability
- Inefficient resource allocation

**OurStreet** bridges this gap with a smart, transparent, community-driven platform.

---

## ✨ Features

### For Citizens
- 🎯 **Easy Issue Reporting** - Report with description, photo, and GPS location
- 🗺️ **Interactive Map** - View all issues on a live map with color-coded status markers
- 📊 **Real-Time Tracking** - Track progress from Open → In Progress → Resolved
- 🔔 **Notifications** - Get updates on your reported issues
- 👍 **Voting System** - Upvote issues to prioritize community concerns
- 💬 **Comments** - Discuss issues with community members and officials
- 📱 **Mobile Responsive** - Works seamlessly on all devices

### For Administrators
- 📈 **Analytics Dashboard** - Real-time metrics and KPIs
- 🎯 **SLA Monitoring** - Track Service Level Agreements and at-risk tickets
- 📊 **Trend Analysis** - Predictive insights for resource allocation
- 🔄 **Issue Management** - Update status, assign teams, add notes
- 👥 **User Management** - Manage citizens and admin accounts
- 📉 **Performance Metrics** - Department efficiency and resolution times
- 🗺️ **Geospatial Analytics** - Hotspot identification and risk assessment

### Advanced Features
- 🤖 **AI Categorization** - Automatic issue categorization using Google Gemini AI
- 🎨 **Dark Mode** - Full dark/light theme support
- ♿ **Accessibility** - WCAG compliant interface
- 🌍 **Multi-Ward Support** - Geographic segmentation for efficient management
- 📸 **Image Upload** - Cloud storage for issue documentation
- 🔐 **Secure Authentication** - JWT-based auth with refresh tokens

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **gsap/ui** - Component library
- **Magic UI** - Advanced UI components
- **MapTiler** - Interactive maps
- **React Hook Form** - Form management

### Backend
- **Next.js API Routes** - Serverless API
- **Supabase** - PostgreSQL database (optional)
- **In-Memory DB** - Development fallback
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

### AI & ML
- **Google Gemini API** - AI-powered categorization and insights

### DevOps
- **Vercel** - Deployment platform
- **Git** - Version control

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Git
- (Optional) Supabase account for production database

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd NIT_GOA_HACKATHON
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. **Configure environment variables** (see below)

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

### First-Time Setup

When you first run the app:
- The in-memory database will initialize automatically
- No Supabase required for development
- Default demo accounts will be available (see Authentication section)

---

## 🔐 Environment Variables

### Required Variables

```bash
# JWT Secret (Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Data Persistence (Optional - for Production)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Enhanced Features (Optional)

```bash
# Google Gemini AI for automatic categorization
GEMINI_API_KEY=your-gemini-api-key

# MapTiler for interactive maps
NEXT_PUBLIC_MAPTILER_API_KEY=your-maptiler-api-key
```

### Environment Setup Commands

```bash
# Verify environment variables
npm run prebuild

# Generate JWT secret
openssl rand -base64 32

# Test setup
node scripts/verify-setup.js
```

---

## 📁 Project Structure

```
NIT_GOA_HACKATHON/
├── app/                      # Next.js 14 App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── issues/          # Issue CRUD operations
│   │   ├── analytics/       # Dashboard analytics
│   │   ├── admin/           # Admin operations
│   │   └── ai/              # AI categorization
│   ├── dashboard/           # Admin dashboard page
│   ├── map/                 # Interactive map page
│   ├── report/              # Issue reporting page
│   ├── login/               # Login page
│   ├── signup/              # Registration page
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # gsap UI components
│   ├── magicui/            # Magic UI components
│   ├── navigation.tsx       # Main navigation
│   ├── interactive-map.tsx  # Map component
│   └── ...
├── contexts/                # React Context providers
│   ├── auth-context.tsx     # Authentication state
│   ├── dashboard-context.tsx # Dashboard data
│   └── issue-context.tsx    # Issue management
├── lib/                     # Utilities and configuration
│   ├── api-client.ts        # API client with retry logic
│   ├── auth.ts              # JWT authentication
│   ├── db.ts                # Database abstraction layer
│   ├── types.ts             # TypeScript types
│   └── utils.ts             # Helper functions
├── supabase/                # Database schema and migrations
│   ├── schema.sql           # PostgreSQL schema
│   └── seed.sql             # Seed data
├── scripts/                 # Utility scripts
│   └── verify-env.js        # Environment validation
└── public/                  # Static assets
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Issues
- `GET /api/issues` - Get all issues (public)
- `POST /api/issues` - Create new issue (authenticated)
- `GET /api/issues/[id]` - Get issue details
- `PATCH /api/issues/[id]` - Update issue (admin only)
- `DELETE /api/issues/[id]` - Delete issue (admin only)
- `POST /api/issues/[id]/vote` - Vote on issue
- `GET /api/issues/[id]/comments` - Get issue comments
- `POST /api/issues/[id]/comments` - Add comment

### Dashboard & Analytics
- `GET /api/dashboard` - Basic dashboard stats (authenticated)
- `GET /api/analytics/stats` - Comprehensive analytics
- `GET /api/analytics/trends` - Trend analysis and predictions
- `GET /api/analytics/sla-alerts` - SLA compliance alerts
- `GET /api/analytics/impact-report` - Community impact metrics

### Admin
- `GET /api/admin/stats` - Admin-only statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/issues` - All issues with admin filters
- `GET /api/admin/audit-logs` - System audit trail

### AI
- `POST /api/ai/categorize` - AI-powered issue categorization

### Public
- `GET /api/public/stats` - Public statistics (no auth required)
- `GET /api/health` - API health check

### File Upload
- `POST /api/upload` - Upload issue images

---

## 🔒 Authentication

### User Roles
- **Citizen** - Report issues, vote, comment
- **Admin** - Manage issues, users, and system settings

### Demo Accounts (Development)

After running seed data:
```
Citizen Account:
Email: john@example.com
Password: Demo1234

Admin Account:
Email: admin@ourstreet.com
Password: Admin1234
```

### Authentication Flow
1. User signs up or logs in
2. Server validates credentials
3. JWT token issued (24h expiry)
4. Refresh token issued (7d expiry)
5. Token stored in localStorage
6. Automatic refresh on expiry

### Protected Routes
- `/dashboard` - View-only for guests, full access for authenticated users
- `/report` - Requires authentication
- `/settings` - Requires authentication
- Admin routes require admin role

### Public Routes (No Auth Required)
- `/` - Landing page
- `/map` - View issues on map
- `/issues` - Browse all issues
- `/team` - Team information
- `/transparency` - Public metrics
- `/login` & `/signup` - Authentication pages

---

## 🗄️ Database Schema

### Tables

#### users
```sql
- id: uuid (PK)
- name: varchar
- email: varchar (unique)
- password_hash: varchar
- role: enum (citizen, admin)
- created_at: timestamp
- updated_at: timestamp
- email_verified: boolean
- phone: varchar
```

#### issues
```sql
- id: uuid (PK)
- title: varchar
- description: text
- category: enum (pothole, streetlight, garbage, water_supply, etc.)
- status: enum (open, in-progress, resolved, closed)
- priority: enum (low, medium, high, critical)
- location: point (lat, lng)
- address: varchar
- ward: varchar
- photo_url: varchar
- user_id: uuid (FK)
- upvotes: integer
- created_at: timestamp
- updated_at: timestamp
- resolved_at: timestamp
```

#### comments
```sql
- id: uuid (PK)
- issue_id: uuid (FK)
- user_id: uuid (FK)
- comment: text
- created_at: timestamp
```

#### votes
```sql
- id: uuid (PK)
- issue_id: uuid (FK)
- user_id: uuid (FK)
- created_at: timestamp
```

### Database Setup

#### For Development (In-Memory)
No setup required - automatically initializes on first run.

#### For Production (Supabase)
1. Create a Supabase project
2. Run the schema:
```bash
psql -U postgres -d your_db < supabase/schema.sql
```
3. (Optional) Seed demo data:
```bash
psql -U postgres -d your_db < supabase/seed.sql
```
4. Set environment variables

---

## 🤖 AI Features

### Automatic Issue Categorization

When reporting an issue, users can optionally enable AI-powered categorization:

**How it works:**
1. User provides title and description
2. AI analyzes the content
3. Suggests category, priority, and tags
4. Provides reasoning for the suggestion
5. User can accept or modify

**Categories supported:**
- Potholes & Road Damage
- Streetlight Issues
- Garbage & Sanitation
- Water Supply Problems
- Drainage & Sewage
- Public Infrastructure
- Traffic & Parking
- Parks & Recreation
- Noise Pollution
- Other

**AI Model:** Google Gemini Pro (gemini-pro)

**Configuration:**
Set `GEMINI_API_KEY` in your environment variables.

**Benefits:**
- Faster issue reporting
- Consistent categorization
- Better priority assessment
- Reduced manual effort

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Configure environment variables
- Deploy!

3. **Set Environment Variables in Vercel**
- Go to Project Settings → Environment Variables
- Add all required variables
- Redeploy

### Environment-Specific Settings

**Development:**
- Uses in-memory database
- Hot reload enabled
- Detailed error messages

**Production:**
- Requires Supabase database
- Optimized builds
- Error tracking enabled
- Rate limiting active

### Post-Deployment Checklist
- ✅ All environment variables set
- ✅ Database schema migrated
- ✅ Domain configured
- ✅ SSL certificate active
- ✅ Test authentication flow
- ✅ Test issue creation
- ✅ Verify map functionality
- ✅ Check analytics dashboard

---

## 🧪 Testing

### Run Tests
```bash
# Type checking
npm run type-check

# Build verification
npm run build

# Environment verification
node scripts/verify-env.js
```

### Manual Testing Checklist
- [ ] User signup and login
- [ ] Report new issue with photo
- [ ] View issues on map
- [ ] Upvote/comment on issues
- [ ] Admin: Update issue status
- [ ] Dashboard analytics load
- [ ] AI categorization works
- [ ] Mobile responsive design
- [ ] Dark mode toggle

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Make your changes**
4. **Commit with clear messages**
```bash
git commit -m "Add: Amazing new feature"
```
5. **Push to your fork**
```bash
git push origin feature/amazing-feature
```
6. **Open a Pull Request**

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Add comments for complex logic

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "JWT_SECRET not set"
**Solution:** Add JWT_SECRET to `.env.local`
```bash
JWT_SECRET=$(openssl rand -base64 32)
```

#### 2. "Cannot connect to database"
**Solution:**
- For development: No action needed (uses in-memory DB)
- For production: Check Supabase credentials

#### 3. "Map not loading"
**Solution:** Add MapTiler API key or use default map (no key required)

#### 4. "AI categorization not working"
**Solution:** Add GEMINI_API_KEY or disable AI feature

#### 5. "Session expired" on every page
**Solution:** Check JWT_SECRET is consistent between deployments

#### 6. Login fails with valid credentials
**Solution:**
- Check password hash format in database
- Run password fix script: `psql < supabase/fix-passwords.sql`

#### 7. Dashboard shows zero values
**Solution:**
- Report some test issues first
- Check analytics API endpoint: `GET /api/analytics/stats`

### Debug Mode

Enable detailed logging:
```bash
# Add to .env.local
DEBUG=true
NODE_ENV=development
```

### Getting Help
- Check existing issues on GitHub
- Review error logs in browser console
- Check API response in Network tab
- Contact: [your-email@example.com]

---

## 📊 Performance

### Optimization Features
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic route-based splitting
- **Lazy Loading** - Dynamic imports for heavy components
- **Caching** - API response caching
- **CDN** - Static assets via Vercel Edge Network
- **Database Indexing** - Optimized queries

### Monitoring
- Real-time analytics dashboard
- API health checks
- Error tracking
- Performance metrics

---

## 📜 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Vercel** - Seamless deployment
- **Supabase** - Excellent PostgreSQL hosting
- **gsap** - Beautiful UI components
- **MapTiler** - Interactive mapping
- **Google** - Gemini AI API
- **NIT Goa Hackathon** - Inspiration and support

---

## 📞 Contact & Support

- **Website:** [yourwebsite.com]
- **Email:** [support@ourstreet.com]
- **GitHub Issues:** [Report a bug or request a feature]
- **Documentation:** [Full docs at /docs]

---

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core issue reporting
- ✅ Interactive map
- ✅ User authentication
- ✅ Admin dashboard
- ✅ AI categorization

### Phase 2 (In Progress)
- 🔄 Real-time notifications (WebSocket)
- 🔄 Mobile app (React Native)
- 🔄 Email notifications
- 🔄 SMS alerts for critical issues

### Phase 3 (Planned)
- 📅 Multi-language support
- 📅 Advanced analytics & ML predictions
- 📅 Integration with municipal systems
- 📅 Public API for third-party apps
- 📅 Citizen leaderboard & gamification

---

## 📈 Statistics

**Current Implementation:**
- 24+ API endpoints
- 20+ React components
- 8 main pages
- 3 context providers
- Full TypeScript coverage
- Responsive design for all screen sizes
- Dark mode support
- AI-powered features
- Real-time analytics

---

**Built with ❤️ for better civic engagement**

**OurStreet** - Empowering communities through technology.

---

*Last Updated: 2025*
