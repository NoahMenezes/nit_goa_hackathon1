# 🚀 OurStreet Platform - Complete Implementation Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation

---

## 📑 Table of Contents

1. [Quick Start](#quick-start)
2. [Current Status](#current-status)
3. [Critical Fix Required](#critical-fix-required)
4. [Database Migrations](#database-migrations)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Implementation Priority](#implementation-priority)
7. [Sprint Plan](#sprint-plan)
8. [Frontend Integration](#frontend-integration)
9. [Testing Guide](#testing-guide)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

# Quick Start

## ⚡ 5-Minute Setup

### Step 1: Fix Citizen Signup (CRITICAL - 5 minutes)

**Problem:** Citizens cannot sign up because `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` is missing.

**Solution:**
```bash
# 1. Get service_role key from Supabase Dashboard
# Go to: https://supabase.com/dashboard → Settings → API → Copy "service_role" key

# 2. Add to .env.local
echo 'SUPABASE_CITIZEN_SERVICE_ROLE_KEY=your_service_role_key_here' >> .env.local

# 3. Restart server
npm run dev

# 4. Test signup at http://localhost:3000/signup
```

### Step 2: Run Database Migrations (30 minutes)

Open Supabase Dashboard → SQL Editor, then run each migration file in order:
1. `supabase/migrations/001_create_notifications.sql`
2. `supabase/migrations/002_create_wards.sql`
3. `supabase/migrations/003_enhance_comments.sql`
4. `supabase/migrations/004_admin_management.sql`

### Step 3: Test New Features (15 minutes)

```bash
# Test notifications
curl -X GET "http://localhost:3000/api/notifications" -H "Cookie: auth-token=YOUR_TOKEN"

# Test search
curl "http://localhost:3000/api/search?q=pothole"

# Verify health
curl http://localhost:3000/api/health
```

---

# Current Status

## ✅ What's Already Working (65% Complete)

### Core Features - Fully Functional
- **Authentication**
  - ✅ POST `/api/auth/login` - User login
  - ⚠️ POST `/api/auth/signup` - User registration (NEEDS CONFIG FIX)
  - ✅ POST `/api/auth/logout` - User logout

- **Issues/Reports - Complete CRUD**
  - ✅ GET `/api/issues` - List all issues with filters
  - ✅ POST `/api/issues` - Create new issue/report
  - ✅ GET `/api/issues/[id]` - Get single issue details
  - ✅ PUT `/api/issues/[id]` - Update issue
  - ✅ DELETE `/api/issues/[id]` - Delete issue

- **Comments System - Fully Functional**
  - ✅ GET `/api/issues/[id]/comments` - Get all comments
  - ✅ POST `/api/issues/[id]/comments` - Add comment
  - ✅ DELETE `/api/issues/[id]/comments?commentId=xxx` - Delete comment

- **Voting System - Complete**
  - ✅ POST `/api/issues/[id]/vote` - Toggle upvote (add/remove)
  - ✅ GET `/api/issues/[id]/vote` - Check if user voted

- **User Profiles**
  - ✅ GET `/api/user/profile` - Get user profile
  - ✅ PUT `/api/user/profile` - Update user profile

- **System**
  - ✅ GET `/api/health` - Health check

### Database Schema - Complete
- ✅ `users` table - User accounts
- ✅ `user_profiles` table - Extended user settings
- ✅ `issues` table - Citizen reports
- ✅ `comments` table - Issue discussions
- ✅ `votes` table - Upvoting system

## ✨ Newly Implemented (Ready to Use)

### New Database Tables (Run Migrations)
- ✅ `notifications` - In-app notification system
- ✅ `wards` - Geographic district management
- ✅ `comment_likes` - Comment like/unlike functionality
- ✅ `issue_assignments` - Admin issue assignment
- ✅ `internal_notes` - Admin-only notes
- ✅ `audit_logs` - Complete audit trail
- ✅ `departments` - Organizational departments
- ✅ `user_departments` - User-department mapping

### New API Endpoints (Backend Ready)
- ✅ GET `/api/notifications` - Get user notifications
- ✅ PUT `/api/notifications/[id]` - Mark as read
- ✅ DELETE `/api/notifications/[id]` - Delete notification
- ✅ POST `/api/notifications` - Mark all as read
- ✅ GET `/api/search` - Full-text search with filters

## 🔨 What Needs to Be Built

### Frontend UI Components Needed
- ❌ Notification bell icon & dropdown
- ❌ Search bar in header
- ❌ Comment like buttons
- ❌ Ward management UI
- ❌ Admin dashboard (real data)
- ❌ Admin user management page

### Backend APIs Needed
- ❌ Comment edit endpoint
- ❌ Comment like/unlike endpoint
- ❌ Ward CRUD endpoints
- ❌ Admin user management endpoints
- ❌ Admin issue assignment endpoints
- ❌ Analytics endpoints

## 📊 Feature Completion Matrix

| Feature | Database | API | Frontend | Status |
|---------|----------|-----|----------|--------|
| Issues/Reports | ✅ 100% | ✅ 100% | ✅ 100% | **Working** |
| Comments | ✅ 100% | ✅ 100% | ✅ 100% | **Working** |
| Voting | ✅ 100% | ✅ 100% | ✅ 100% | **Working** |
| Notifications | ✅ 100% | ✅ 100% | ❌ 0% | **Need UI** |
| Search | ✅ 100% | ✅ 100% | ❌ 0% | **Need UI** |
| Comment Likes | ✅ 100% | ❌ 0% | ❌ 0% | **Need API+UI** |
| Nested Replies | ✅ 100% | ❌ 0% | ❌ 0% | **Need API+UI** |
| Wards | ✅ 100% | ❌ 0% | ❌ 0% | **Need API+UI** |
| Admin Tools | ✅ 100% | ❌ 0% | ❌ 0% | **Need API+UI** |
| User Signup | ✅ 100% | ⚠️ 99% | ✅ 100% | **Config Fix** |

**Overall Progress: 65% Complete**

---

# Critical Fix Required

## ⚠️ BLOCKING ISSUE: Citizen Signup Not Working

### Problem
```
Error: Supabase citizen database is not configured
Status: 500 Internal Server Error
Cause: Missing SUPABASE_CITIZEN_SERVICE_ROLE_KEY environment variable
```

### Impact
- **CRITICAL:** Citizens cannot create accounts
- Blocks new user registration
- Prevents platform growth
- Must fix before any deployment

### Root Cause
The signup endpoint (`app/api/auth/signup/route.ts`) uses:
```typescript
const supabase = getSupabaseClientByRole(role, true); // service-role client
```

This requires `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` which is not configured.

### Solution (5 minutes)

**Step 1: Get Service Role Key**
1. Go to https://supabase.com/dashboard
2. Select your **citizen database** project
3. Navigate to: **Settings → API**
4. Find the **service_role** key (NOT the anon key)
5. Copy the full key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

**Step 2: Add to Environment Variables**

Create or update `.env.local` in project root:
```bash
# Citizen Database Service Role Key
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_KEY_HERE...
```

**⚠️ IMPORTANT:** This is the **service_role** key, NOT the **anon** key!

**Step 3: Restart Development Server**
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
```

**Step 4: Verify Fix**

```bash
# Method 1: Run check script
chmod +x check-citizen-config.sh
./check-citizen-config.sh

# Method 2: Check health endpoint
curl http://localhost:3000/api/health
# Should show: "citizenSupabaseAdmin": "configured"

# Method 3: Test signup
# Go to: http://localhost:3000/signup
# Try creating a new account
```

### Expected Output After Fix

**Before (Error):**
```json
{
  "success": false,
  "error": "Database configuration error"
}
```

**After (Success):**
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

### Security Note
- **NEVER** commit service_role keys to Git
- Service_role keys bypass Row Level Security (RLS)
- Only use on server-side (never in client code)
- Keep `.env.local` in `.gitignore`

---

# Database Migrations

## Overview

Four migration files have been created in `supabase/migrations/`:

1. **001_create_notifications.sql** - Notification system
2. **002_create_wards.sql** - Geographic wards/districts
3. **003_enhance_comments.sql** - Comment likes & replies
4. **004_admin_management.sql** - Admin tools & audit logs

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy contents of each migration file
5. Click **Run** (repeat for each migration)

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
supabase db push

# Or run individually
psql YOUR_DATABASE_URL < supabase/migrations/001_create_notifications.sql
```

## Migration Details

### Migration 1: Notifications System

**File:** `001_create_notifications.sql`

**Creates:**
- `notifications` table
- Automatic triggers for:
  - New comments → notify issue owner
  - Status changes → notify user
  - Issue resolution → celebration notification
- Views for unread counts
- Cleanup function for old notifications

**Tables:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50), -- comment, status_update, vote, resolution, etc.
  title VARCHAR(255),
  message TEXT,
  issue_id UUID,
  comment_id UUID,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

**Verification:**
```sql
-- Check table exists
SELECT COUNT(*) FROM notifications;

-- Check triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';

-- Test: Create a comment and check if notification appears
```

---

### Migration 2: Ward Management

**File:** `002_create_wards.sql`

**Creates:**
- `wards` table for geographic divisions
- Links issues to wards via `ward_id`
- Ward statistics views
- Sample ward data for Panjim, Goa

**Tables:**
```sql
CREATE TABLE wards (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  number INTEGER UNIQUE,
  boundaries JSONB, -- GeoJSON polygon
  population INTEGER,
  councilor_name VARCHAR(255),
  councilor_email VARCHAR(255),
  councilor_phone VARCHAR(20),
  office_address TEXT,
  created_at TIMESTAMPTZ
);

ALTER TABLE issues ADD COLUMN ward_id UUID REFERENCES wards(id);
```

**Post-Migration Tasks:**
- Replace sample ward data with actual city wards
- Update ward boundaries (GeoJSON format)
- Populate councilor information
- Assign existing issues to wards

**Sample Ward Data:**
```json
{
  "name": "Ward 1 - Panjim Central",
  "number": 1,
  "boundaries": {
    "type": "Polygon",
    "coordinates": [[[73.827, 15.490], [73.835, 15.490], ...]]
  }
}
```

---

### Migration 3: Comment Enhancements

**File:** `003_enhance_comments.sql`

**Creates:**
- `comment_likes` table
- Nested replies support (`parent_comment_id`)
- Edit tracking (`is_edited`, `updated_at`)
- Like/unlike triggers
- Reply notification triggers

**Tables:**
```sql
ALTER TABLE comments ADD COLUMN parent_comment_id UUID;
ALTER TABLE comments ADD COLUMN likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN updated_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

CREATE TABLE comment_likes (
  id UUID PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ,
  UNIQUE(comment_id, user_id)
);
```

**Features Enabled:**
- Threaded/nested comments
- Like/unlike comments
- Track comment edits
- Notification on replies

---

### Migration 4: Admin Management

**File:** `004_admin_management.sql`

**Creates:**
- `issue_assignments` - Track issue assignments
- `internal_notes` - Admin-only notes
- `audit_logs` - Complete audit trail
- `departments` - Organizational structure
- `user_departments` - User-department mapping
- Admin dashboard views

**Tables:**
```sql
CREATE TABLE issue_assignments (
  id UUID PRIMARY KEY,
  issue_id UUID NOT NULL,
  assigned_to UUID,
  department VARCHAR(100),
  assigned_by UUID,
  notes TEXT,
  status VARCHAR(20),
  assigned_at TIMESTAMPTZ
);

CREATE TABLE internal_notes (
  id UUID PRIMARY KEY,
  issue_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  visibility VARCHAR(20),
  created_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  code VARCHAR(20) UNIQUE,
  categories VARCHAR(50)[],
  active BOOLEAN
);
```

**Sample Departments:**
- Roads & Infrastructure
- Sanitation & Waste
- Public Utilities
- Traffic Management
- General Services

---

## Post-Migration Checklist

After running all migrations:

- [ ] Verify all tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
  ```

- [ ] Check indexes were created:
  ```sql
  SELECT indexname, tablename FROM pg_indexes 
  WHERE schemaname = 'public' 
  ORDER BY tablename, indexname;
  ```

- [ ] Verify triggers are active:
  ```sql
  SELECT tgname, tgtype, tgenabled, tgrelid::regclass 
  FROM pg_trigger 
  WHERE tgname NOT LIKE 'RI_%'
  ORDER BY tgrelid::regclass::text;
  ```

- [ ] Test notification triggers by creating a test comment
- [ ] Add real ward data for your city
- [ ] Update department information
- [ ] Verify RLS policies are enabled

---

# API Endpoints Reference

## Authentication Endpoints

### POST /api/auth/login
Login user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "citizen"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "citizen"
    },
    "token": "jwt-token-here"
  }
}
```

### POST /api/auth/signup
Register new user (NEEDS CONFIG FIX).

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "citizen"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup successful",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

### POST /api/auth/logout
Logout current user.

---

## Issues/Reports Endpoints

### GET /api/issues
List all issues with filtering and pagination.

**Query Parameters:**
- `category` - Filter by category (pothole, streetlight, etc.)
- `status` - Filter by status (open, in-progress, resolved, closed)
- `priority` - Filter by priority (low, medium, high, critical)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (created_at, votes, priority)
- `sortOrder` - Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [...],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
}
```

### POST /api/issues
Create new issue/report.

**Request:**
```json
{
  "title": "Large pothole on Main Street",
  "description": "Dangerous pothole causing vehicle damage",
  "category": "pothole",
  "location": "Main Street, Panjim",
  "latitude": 15.4909,
  "longitude": 73.8278,
  "photoUrl": "https://...",
  "priority": "high"
}
```

### GET /api/issues/[id]
Get single issue details.

### PUT /api/issues/[id]
Update issue (owner or admin only).

### DELETE /api/issues/[id]
Delete issue (owner or admin only).

---

## Comments Endpoints

### GET /api/issues/[id]/comments
Get all comments for an issue.

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "userId": "uuid",
        "userName": "John Doe",
        "content": "I saw this too!",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

### POST /api/issues/[id]/comments
Add comment to issue.

**Request:**
```json
{
  "content": "This needs immediate attention!"
}
```

### DELETE /api/issues/[id]/comments?commentId=xxx
Delete comment (owner or admin only).

---

## Voting Endpoints

### POST /api/issues/[id]/vote
Toggle vote (upvote/unvote).

**Response:**
```json
{
  "success": true,
  "message": "Vote added",
  "data": {
    "voted": true,
    "votes": 15
  }
}
```

### GET /api/issues/[id]/vote
Check if current user voted.

---

## Notifications Endpoints (NEW ✨)

### GET /api/notifications
Get user notifications with pagination and filtering.

**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20)
- `unread` - Filter unread only (true/false)
- `type` - Filter by type (comment, status_update, vote, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "comment",
        "title": "New comment on your issue",
        "message": "Jane Smith commented: I saw this too!",
        "issueId": "uuid",
        "read": false,
        "actionUrl": "/issues/uuid",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 25,
    "unreadCount": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

### PUT /api/notifications/[id]
Mark single notification as read.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": { ... }
  }
}
```

### POST /api/notifications
Mark all notifications as read.

**Request:**
```json
{
  "action": "mark_all_read"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "markedCount": 5
  }
}
```

### DELETE /api/notifications/[id]
Delete notification.

---

## Search Endpoint (NEW ✨)

### GET /api/search
Full-text search with filters and pagination.

**Query Parameters:**
- `q` - Search query (searches title, description, location)
- `category` - Filter by category
- `status` - Filter by status
- `priority` - Filter by priority
- `location` - Filter by location
- `wardId` - Filter by ward
- `userId` - Filter by user
- `sortBy` - Sort by (relevance, date, votes, priority)
- `page` - Page number
- `pageSize` - Items per page

**Examples:**
```bash
# Simple search
GET /api/search?q=pothole

# Search with filters
GET /api/search?q=water&category=water_leak&status=open

# Search by location
GET /api/search?location=Panjim

# Sort by votes
GET /api/search?q=road&sortBy=votes
```

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": [...],
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "filters": {
      "query": "pothole",
      "category": null,
      "status": null,
      "sortBy": "relevance"
    },
    "facets": {
      "categories": { "pothole": 10, "road": 5 },
      "statuses": { "open": 12, "in-progress": 3 }
    }
  }
}
```

---

## User Profile Endpoints

### GET /api/user/profile
Get current user profile.

### PUT /api/user/profile
Update user profile.

---

## System Endpoints

### GET /api/health
Health check and configuration status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T10:00:00Z",
    "supabase": {
      "configured": true,
      "citizenSupabase": "configured",
      "citizenSupabaseAdmin": "configured",
      "adminSupabase": "configured"
    }
  }
}
```

---

# Implementation Priority

## Priority Levels

- **P0 - Critical:** Blocking issues, must fix immediately
- **P1 - High:** Core features for MVP
- **P2 - Medium:** Important but not blocking
- **P3 - Low:** Nice to have, can wait

## Complete Endpoint Checklist

### ✅ IMPLEMENTED (14 endpoints)

1. ✅ POST `/api/auth/login`
2. ⚠️ POST `/api/auth/signup` (needs config)
3. ✅ POST `/api/auth/logout`
4. ✅ GET `/api/issues`
5. ✅ POST `/api/issues`
6. ✅ GET `/api/issues/[id]`
7. ✅ PUT `/api/issues/[id]`
8. ✅ DELETE `/api/issues/[id]`
9. ✅ GET `/api/issues/[id]/comments`
10. ✅ POST `/api/issues/[id]/comments`
11. ✅ DELETE `/api/issues/[id]/comments`
12. ✅ POST `/api/issues/[id]/vote`
13. ✅ GET `/api/issues/[id]/vote`
14. ✅ GET `/api/user/profile`
15. ✅ PUT `/api/user/profile`
16. ✅ GET `/api/health`
17. ✅ GET `/api/notifications` (NEW)
18. ✅ PUT `/api/notifications/[id]` (NEW)
19. ✅ DELETE `/api/notifications/[id]` (NEW)
20. ✅ POST `/api/notifications` (NEW)
21. ✅ GET `/api/search` (NEW)

### 🔥 HIGH PRIORITY - NOT IMPLEMENTED

**Comment Enhancements (2 endpoints)**
22. ❌ PUT `/api/comments/[id]` - Edit comment
23. ❌ POST `/api/comments/[id]/like` - Like/unlike comment

**Search Enhancement (1 endpoint)**
24. ❌ GET `/api/search/suggestions` - Autocomplete

**Upload Enhancement**
25. ⚠️ POST `/api/upload` - Verify & enhance

### ⚙️ MEDIUM PRIORITY - NOT IMPLEMENTED

**Ward Management (4 endpoints)**
26. ❌ GET `/api/wards`
27. ❌ GET `/api/wards/[id]`
28. ❌ GET `/api/wards/[id]/issues`
29. ❌ GET `/api/wards/[id]/analytics`

**Admin User Management (4 endpoints)**
30. ❌ GET `/api/admin/users`
31. ❌ PUT `/api/admin/users/[id]`
32. ❌ DELETE `/api/admin/users/[id]`
33. ❌ POST `/api/admin/users/[id]/ban`

**Admin Issue Management (3 endpoints)**
34. ❌ GET `/api/admin/issues`
35. ❌ PUT `/api/admin/issues/[id]/assign`
36. ❌ PUT `/api/admin/issues/[id]/priority`

**Analytics (3 endpoints)**
37. ❌ GET `/api/analytics/stats`
38. ❌ GET `/api/analytics/trends`
39. ❌ GET `/api/analytics/categories`

### 📊 LOW PRIORITY - NOT IMPLEMENTED

**User Activity (2 endpoints)**
40. ❌ GET `/api/user/activity`
41. ❌ GET `/api/user/statistics`

**Export (2 endpoints)**
42. ❌ GET `/api/user/export`
43. ❌ GET `/api/admin/reports/export`

**Advanced Features (10+ endpoints)**
44. ❌ AI features (sentiment, suggestions, predictions)
45. ❌ Public API endpoints
46. ❌ Webhooks
47. ❌ Audit logs API
48. ❌ And more...

---

# Sprint Plan

## Sprint 1 (Week 1): Critical Fixes

**Goal:** Fix blockers and enable core functionality

### Day 1
**Morning:**
- [ ] Fix citizen signup config (5 min) ⚠️ **DO THIS FIRST!**
- [ ] Verify signup works
- [ ] Run notification migration

**Afternoon:**
- [ ] Test notification triggers
- [ ] Create test notifications
- [ ] Verify notification system works

**Deliverable:** Citizens can sign up, notifications work

### Day 2
- [ ] Run ward migration
- [ ] Run comment enhancements migration
- [ ] Run admin management migration
- [ ] Verify all migrations successful

**Deliverable:** All database tables created

### Day 3-4
**Frontend Work:**
- [ ] Create NotificationDropdown component
- [ ] Add notification bell icon to header
- [ ] Show unread count badge
- [ ] Implement notification list
- [ ] Add "mark as read" functionality
- [ ] Add "mark all as read" button

**Deliverable:** Notification UI complete

### Day 5
**Frontend Work:**
- [ ] Create SearchBar component
- [ ] Add search input to header
- [ ] Implement search results page
- [ ] Add search filters (category, status, etc.)
- [ ] Add sorting options

**Testing:**
- [ ] Test all new features
- [ ] Fix bugs found
- [ ] Deploy to staging

**Deliverable:** Search UI complete, Sprint 1 done

**Sprint 1 Success Metrics:**
- ✅ 100% signup success rate
- ✅ Users receive notifications
- ✅ Search functionality works
- 🎯 Target: 90% of core features working

---

## Sprint 2 (Week 2): Admin Features

**Goal:** Enable admin moderation and real data

### Day 1-2
**Replace Dashboard Mock Data:**
- [ ] Create real analytics queries
- [ ] Replace hardcoded data in `/api/dashboard`
- [ ] Add real-time statistics
- [ ] Create dashboard view components
- [ ] Add charts for trends
- [ ] Test with real data

**Deliverable:** Dashboard shows real data

### Day 3-4
**Admin User Management:**
- [ ] Build GET `/api/admin/users` endpoint
- [ ] Build PUT `/api/admin/users/[id]` endpoint
- [ ] Create admin user list page
- [ ] Add user status management (ban, suspend)
- [ ] Add role management
- [ ] Create user detail modal

**Deliverable:** Admin can manage users

### Day 5
**Issue Assignment:**
- [ ] Build PUT `/api/admin/issues/[id]/assign` endpoint
- [ ] Create assignment UI
- [ ] Add department dropdown
- [ ] Add assignment notes
- [ ] Test assignment workflow

**Testing & Deployment:**
- [ ] Test all admin features
- [ ] Fix bugs
- [ ] Deploy to staging

**Deliverable:** Admin tools functional

**Sprint 2 Success Metrics:**
- ✅ Dashboard shows real data
- ✅ Admins can manage users
- ✅ Issue assignment works
- 🎯 Target: 95% MVP complete

---

## Sprint 3 (Week 3): Enhancements

**Goal:** Add advanced features

### Tasks
- [ ] Build comment edit endpoint
- [ ] Build comment like/unlike endpoint
- [ ] Add ward management UI
- [ ] Build ward CRUD endpoints
- [ ] Implement analytics endpoints
- [ ] Create analytics dashboard
- [ ] Add user activity tracking
- [ ] Build leaderboard

**Deliverable:** Enhanced user engagement features

**Sprint 3 Success Metrics:**
- ✅ Comment likes work
- ✅ Ward filtering works
- ✅ Analytics dashboard live
- 🎯 Target: 100% MVP ready

---

## Sprint 4+ (Week 4+): Polish & Advanced

### Potential Features
- [ ] Email notifications (SendGrid/Resend)
- [ ] Real-time updates (WebSockets/Pusher)
- [ ] PWA with offline support
- [ ] Advanced AI features
- [ ] Export functionality
- [ ] Public API
- [ ] Mobile app

---

# Frontend Integration

## Notifications Component

```typescript
// components/notifications-dropdown.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true&pageSize=10');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications ({unreadCount})</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {loading ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-400 mt-2 block">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t text-center">
              <a
                href="/notifications"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Search Component

```typescript
// components/search-bar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&pageSize=5`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setResults(data.data.issues);
          setIsOpen(true);
        }
      })
      .catch(error => console.error('Search error:', error))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search issues by title, description, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && !loading && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
          {results.map(issue => (
            <a
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="block p-4 border-b hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{issue.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {issue.category}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {issue.status}
                    </span>
                    <span className="text-xs text-gray-500">{issue.location}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
          <div className="p-2 text-center border-t">
            <a
              href={`/search?q=${encodeURIComponent(query)}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all {results.length}+ results
            </a>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-8 bg-white rounded-lg shadow-lg border text-center text-gray-500">
          No issues found for "{query}"
        </div>
      )}
    </div>
  );
}
```

## Debounce Hook

```typescript
// hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

# Testing Guide

## Manual Testing

### Signup Fix Testing

```bash
# 1. Verify environment variable
cat .env.local | grep SUPABASE_CITIZEN_SERVICE_ROLE_KEY

# 2. Check health endpoint
curl http://localhost:3000/api/health
# Should show: "citizenSupabaseAdmin": "configured"

# 3. Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "citizen"
  }'
```

### Notifications Testing

```bash
# Get notifications (replace YOUR_TOKEN)
curl -X GET "http://localhost:3000/api/notifications?page=1&unread=true" \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Mark as read
curl -X PUT "http://localhost:3000/api/notifications/NOTIFICATION_ID" \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Delete notification
curl -X DELETE "http://localhost:3000/api/notifications/NOTIFICATION_ID" \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Mark all as read
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{"action": "mark_all_read"}'
```

### Search Testing

```bash
# Basic search
curl "http://localhost:3000/api/search?q=pothole"

# Search with filters
curl "http://localhost:3000/api/search?q=water&category=water_leak&status=open"

# Search by location
curl "http://localhost:3000/api/search?location=Panjim"

# Sort by votes
curl "http://localhost:3000/api/search?q=road&sortBy=votes"

# Paginated search
curl "http://localhost:3000/api/search?q=garbage&page=2&pageSize=10"
```

### Database Verification

```sql
-- Check notifications table
SELECT COUNT(*) FROM notifications;

-- Check recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check wards table
SELECT * FROM wards;

-- Check comment enhancements
SELECT c.*, 
  (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
FROM comments c 
LIMIT 5;

-- Check audit logs
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

## Automated Testing

### Jest Test Setup

Create `__tests__/api/notifications.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Notifications API', () => {
  let authToken: string;
  let notificationId: string;

  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    authToken = loginData.data.token;
  });

  it('should get user notifications', async () => {
    const res = await fetch('http://localhost:3000/api/notifications', {
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.notifications)).toBe(true);
    expect(typeof data.data.unreadCount).toBe('number');
  });

  it('should mark notification as read', async () => {
    const listRes = await fetch('http://localhost:3000/api/notifications?unread=true', {
      headers: { 'Cookie': `auth-token=${authToken}` }
    });
    const listData = await listRes.json();

    if (listData.data.notifications.length > 0) {
      const notifId = listData.data.notifications[0].id;

      const res = await fetch(`http://localhost:3000/api/notifications/${notifId}`, {
        method: 'PUT',
        headers: { 'Cookie': `auth-token=${authToken}` }
      });
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.data.notification.read).toBe(true);
    }
  });

  it('should mark all notifications as read', async () => {
    const res = await fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({ action: 'mark_all_read' })
    });
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(typeof data.data.markedCount).toBe('number');
  });
});
```

### Run Tests

```bash
# Install dependencies
npm install --save-dev jest @jest/globals

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Testing Checklist

### Authentication
- [ ] User can sign up as citizen
- [ ] User can sign up as admin
- [ ] User can login with email/password
- [ ] User can logout
- [ ] Session persists after page refresh
- [ ] Invalid credentials show error
- [ ] Duplicate email shows error

### Issues/Reports
- [ ] User can create new issue
- [ ] User can upload photo with issue
- [ ] Issues display on map correctly
- [ ] User can filter by category
- [ ] User can filter by status
- [ ] User can sort by date/votes
- [ ] User can edit own issue
- [ ] User can delete own issue
- [ ] Admin can edit any issue
- [ ] Pagination works correctly

### Comments
- [ ] User can add comment
- [ ] Comments display in order
- [ ] User can delete own comment
- [ ] Admin can delete any comment
- [ ] Comment count updates
- [ ] Notification sent to issue owner

### Voting
- [ ] User can upvote issue
- [ ] Vote count increases
- [ ] User can remove vote
- [ ] Vote count decreases
- [ ] User cannot vote twice
- [ ] Vote persists after refresh

### Notifications
- [ ] User receives notification on new comment
- [ ] User receives notification on status change
- [ ] User receives notification on resolution
- [ ] Notification bell shows unread count
- [ ] User can mark notification as read
- [ ] User can mark all as read
- [ ] User can delete notification
- [ ] Notification links work correctly

### Search
- [ ] Search finds issues by title
- [ ] Search finds issues by description
- [ ] Search finds issues by location
- [ ] Category filter works
- [ ] Status filter works
- [ ] Location filter works
- [ ] Sort by relevance works
- [ ] Sort by date works
- [ ] Sort by votes works
- [ ] Pagination works
- [ ] Empty search shows message

---

# Deployment

## Environment Variables Checklist

Create `.env.local` file in project root with:

```bash
# === CRITICAL - MISSING ===
SUPABASE_CITIZEN_SERVICE_ROLE_KEY=your_service_role_key_here

# === Citizen Database (Supabase) ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Admin Database (if separate) ===
SUPABASE_ADMIN_URL=https://yyy.supabase.co
SUPABASE_ADMIN_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ADMIN_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Image Upload (Cloudinary) ===
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# === Authentication ===
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# === Optional Services ===
NEXT_PUBLIC_MAP_API_KEY=your-maptiler-or-mapbox-key
```

## Pre-Deployment Checklist

### Database
- [ ] All migrations run successfully
- [ ] Indexes created for performance
- [ ] RLS policies enabled
- [ ] Triggers functioning correctly
- [ ] Test data cleaned up
- [ ] Backup strategy in place

### Code
- [ ] All tests passing
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Environment variables configured
- [ ] `.env.local` in `.gitignore`
- [ ] Service keys NOT in version control

### Testing
- [ ] Manual testing complete
- [ ] All endpoints tested
- [ ] Frontend components tested
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Performance testing done

### Security
- [ ] Service role keys on server only
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation everywhere
- [ ] SQL injection prevention
- [ ] XSS protection enabled

## Deploy to Vercel

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 4: Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`
5. Make sure to add for all environments:
   - Production
   - Preview
   - Development

### Step 5: Redeploy

```bash
# Redeploy to pick up environment variables
vercel --prod
```

## Deploy to Other Platforms

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### DigitalOcean App Platform

1. Push code to GitHub
2. Connect repository in DigitalOcean
3. Add environment variables
4. Deploy

## Post-Deployment

### Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Test signup
curl -X POST https://your-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123","role":"citizen"}'

# Test search
curl "https://your-domain.com/api/search?q=test"
```

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Vercel Analytics, Google Analytics)
- [ ] Enable performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation

### Database Backup

- [ ] Enable automated Supabase backups
- [ ] Schedule manual backups
- [ ] Test restore procedure
- [ ] Document backup strategy

---

# Troubleshooting

## Common Issues

### Issue: "Supabase citizen database is not configured"

**Symptoms:**
- 500 error on signup
- Console shows: "Database configuration error"
- Health endpoint shows `citizenSupabaseAdmin: null`

**Solution:**
1. Check if `SUPABASE_CITIZEN_SERVICE_ROLE_KEY` exists:
   ```bash
   cat .env.local | grep SUPABASE_CITIZEN_SERVICE_ROLE_KEY
   ```

2. If missing, add it from Supabase Dashboard:
   - Settings → API → Copy service_role key
   - Add to `.env.local`

3. Restart server:
   ```bash
   npm run dev
   ```

4. Verify fix:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

### Issue: Notifications not appearing

**Symptoms:**
- User doesn't receive notifications
- `notifications` table is empty
- Triggers not firing

**Diagnosis:**
```sql
-- Check if table exists
SELECT COUNT(*) FROM notifications;

-- Check if triggers exist
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%notify%';
```

**Solution:**
1. Re-run notification migration:
   ```sql
   -- Copy/paste content from 001_create_notifications.sql
   ```

2. Verify triggers are enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgenabled = 'O';
   ```

3. Test manually:
   ```sql
   -- Create test notification
   INSERT INTO notifications (user_id, type, title, message)
   VALUES ('YOUR_USER_ID', 'system', 'Test', 'Test notification');
   ```

---

### Issue: Search returns no results

**Symptoms:**
- Search returns empty array
- No errors in console
- Issues exist in database

**Diagnosis:**
```sql
-- Check if issues exist
SELECT COUNT(*) FROM issues;

-- Test simple query
SELECT * FROM issues WHERE title ILIKE '%pothole%';
```

**Solution:**
1. Check search query:
   ```bash
   curl "http://localhost:3000/api/search?q=test" -v
   ```

2. Check if filters are too restrictive:
   ```bash
   # Remove filters
   curl "http://localhost:3000/api/search?q=test"
   ```

3. Add search indexes:
   ```sql
   CREATE INDEX idx_issues_search ON issues 
   USING GIN (to_tsvector('english', title || ' ' || description || ' ' || location));
   ```

---

### Issue: Images not uploading

**Symptoms:**
- Upload returns error
- Image doesn't appear
- 500 error

**Diagnosis:**
```bash
# Check Cloudinary config
cat .env.local | grep CLOUDINARY

# Test upload endpoint
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg"
```

**Solution:**
1. Verify Cloudinary credentials
2. Check file size (max 5MB)
3. Check file type (jpg, png, gif)
4. Check network tab for errors
5. Try Supabase Storage as fallback

---

### Issue: Database connection errors

**Symptoms:**
- "Connection refused"
- "Too many connections"
- Slow queries

**Solution:**
1. Check Supabase status
2. Verify database URL
3. Enable connection pooling
4. Increase connection limit
5. Optimize slow queries

---

### Issue: CORS errors

**Symptoms:**
- "CORS policy blocked"
- Cannot access API from frontend

**Solution:**

Add to `next.config.ts`:
```typescript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

## Performance Issues

### Slow Database Queries

**Diagnosis:**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solution:**
1. Add missing indexes
2. Use pagination
3. Optimize JOIN queries
4. Enable caching
5. Use materialized views

### High Memory Usage

**Solution:**
1. Implement pagination everywhere
2. Use lazy loading for images
3. Reduce bundle size
4. Enable code splitting
5. Use CDN for static assets

---

## Debug Mode

Enable debug logging:

```typescript
// lib/debug.ts
export const DEBUG = process.env.NODE_ENV === 'development';

export function log(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Usage in API routes
import { log } from '@/lib/debug';

log('User ID:', user.userId);
log('Query params:', searchParams.toString());
```

---

# Appendix

## Complete Database Schema

```sql
-- Users and Profiles
users (id, name, email, password, role, status, created_at, updated_at)
user_profiles (id, user_id, phone, address, settings, ...)

-- Issues and Engagement
issues (id, title, description, category, location, lat, lng, status, priority, user_id, ward_id, votes, created_at)
comments (id, issue_id, user_id, user_name, content, parent_comment_id, likes, is_edited, created_at, updated_at)
votes (id, issue_id, user_id, created_at)
comment_likes (id, comment_id, user_id, created_at)

-- Notifications
notifications (id, user_id, type, title, message, issue_id, comment_id, read, action_url, metadata, created_at)

-- Geographic
wards (id, name, number, boundaries, population, councilor_name, councilor_email, created_at)

-- Admin
issue_assignments (id, issue_id, assigned_to, department, assigned_by, notes, status, assigned_at)
internal_notes (id, issue_id, user_id, content, visibility, created_at)
audit_logs (id, user_id, action, resource_type, resource_id, changes, ip_address, created_at)
departments (id, name, code, categories, active, created_at)
user_departments (id, user_id, department_id, role, created_at)
```

## API Response Format

All API endpoints follow this standard response format:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE" // Optional
}
```

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

## Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:migrate         # Run migrations
npm run db:seed            # Seed database
npm run db:reset           # Reset database

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Deployment
vercel                     # Deploy to preview
vercel --prod              # Deploy to production

# Utilities
npm run lint               # Lint code
npm run format             # Format code
npm run type-check         # Check TypeScript
```

---

## Next Steps

### Immediate (Do Now)
1. ✅ Fix citizen signup config
2. ✅ Run all database migrations
3. ✅ Test notifications and search
4. 🔨 Build notification UI component
5. 🔨 Build search bar component

### This Week
6. 🔨 Replace dashboard mock data
7. 🔨 Add notification bell to header
8. 🔨 Add search to header
9. 🔨 Test and fix bugs
10. 🚀 Deploy to staging

### Next Week
11. 🔨 Build admin user management
12. 🔨 Build issue assignment UI
13. 🔨 Add ward management
14. 🔨 Create analytics dashboard
15. 🚀 Deploy to production

---

**Documentation Last Updated:** 2024  
**Version:** 1.0  
**Maintainer:** Development Team

**For questions or issues, refer to:**
- GitHub Issues
- Supabase Dashboard Logs
- Vercel Deployment Logs
- This documentation

🎉 **Good luck with implementation!**