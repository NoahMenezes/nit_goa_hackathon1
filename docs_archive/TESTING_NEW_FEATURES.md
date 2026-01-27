# Testing Guide - New Features Implementation

## 🚀 Quick Start Testing

This guide helps you test all the newly implemented features.

---

## ✅ Feature 1: Role-Based Signup (User vs Administrator)

### Test User Signup:
1. Navigate to `/signup`
2. Fill in the form:
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `Test1234`
   - Confirm Password: `Test1234`
   - **Account Type: Select "User (Citizen)"**
3. Click "Create Account"
4. ✅ **Expected**: Redirected to `/dashboard`
5. ✅ **Expected**: User role = "citizen" in database

### Test Admin Signup:
1. Navigate to `/signup`
2. Fill in the form:
   - Name: `Test Admin`
   - Email: `testadmin@example.com`
   - Password: `Admin1234`
   - Confirm Password: `Admin1234`
   - **Account Type: Select "Administrator"**
3. Click "Create Account"
4. ✅ **Expected**: Redirected to `/admin`
5. ✅ **Expected**: User role = "admin" in database

---

## ✅ Feature 2: Map Zoom-to-Marker on Click

### Test Marker Click:
1. Navigate to `/map`
2. Wait for map to load with issue markers
3. Click on any red/amber/green marker
4. ✅ **Expected**: Map smoothly zooms to zoom level 16
5. ✅ **Expected**: Marker is centered on screen
6. ✅ **Expected**: Animation duration ~1.5 seconds
7. ✅ **Expected**: Issue details highlighted in sidebar
8. Try clicking different markers
9. ✅ **Expected**: Each click triggers zoom to that marker

---

## ✅ Feature 3: Report Issue System (Fully Functional)

### Test Full Report Flow:
1. Navigate to `/map`
2. Click **"Report New Issue"** button (top right)
3. Dialog opens - fill in the form:
   - **Title**: `Test Pothole on Main Street`
   - **Description**: `Large pothole causing traffic issues`
   - **Category**: Select `Pothole`
   - **Photo**: (Optional) Upload a test image
   - **Location**: Click the location button (📍)
4. ✅ **Expected**: Location captured and displayed (lat/lng)
5. Click **"Submit Report"**
6. ✅ **Expected**: Toast notification "Uploading photo..." (if photo added)
7. ✅ **Expected**: Toast notification "Submitting report..."
8. ✅ **Expected**: Toast notification "Issue reported successfully!"
9. ✅ **Expected**: New marker appears on map immediately
10. ✅ **Expected**: Map automatically zooms to new issue location
11. ✅ **Expected**: New issue visible in "Recent Issues" section below map
12. ✅ **Expected**: Form resets and dialog closes

### Test Form Validation:
1. Click "Report New Issue"
2. Try to submit without filling fields
3. ✅ **Expected**: Browser validation prevents submission
4. Fill only title, try to submit
5. ✅ **Expected**: Validation requires all fields
6. Try to submit without capturing location
7. ✅ **Expected**: Toast error "Please capture your location before submitting"

### Test Photo Upload (Optional):
1. Open report form
2. Click photo input or camera button
3. Select an image file (JPG, PNG, etc.)
4. ✅ **Expected**: File name appears in input
5. Submit the form
6. ✅ **Expected**: Photo uploads first, then issue creates
7. Check created issue - should have photoUrl

---

## ✅ Feature 4: AI Priority Based on Health Risk & Facility Importance

### Test AI Categorization:
This runs automatically when creating issues. To verify:

1. Create issue with high health risk:
   - Title: `Sewage overflow near hospital`
   - Description: `Raw sewage leaking, bad smell, health hazard`
   - Category: `Sanitation`
2. ✅ **Expected**: AI assigns **Critical** or **High** priority

3. Create issue with low health risk:
   - Title: `Small crack on side street`
   - Description: `Minor cosmetic crack, no danger`
   - Category: `Road`
4. ✅ **Expected**: AI assigns **Low** or **Medium** priority

5. Create issue at important facility:
   - Title: `Broken streetlight near school`
   - Description: `Dark area where children walk`
   - Category: `Streetlight`
6. ✅ **Expected**: AI assigns **High** priority (important facility)

### Verify AI Metadata:
Check issue in database or API response:
```json
{
  "aiMetadata": {
    "category": "sanitation",
    "priority": "critical",
    "confidence": 0.95,
    "reasoning": "Health risk from sewage near healthcare facility",
    "tags": ["health-hazard", "urgent", "sanitation"]
  }
}
```

---

## ✅ Feature 5: Super Thin Scrollbars

### Test Scrollbar Visibility:
1. Navigate to any page with scrollable content (`/map`, `/issues`, `/dashboard`)
2. ✅ **Expected**: Scrollbars are barely visible (very thin, ~4px)
3. ✅ **Expected**: Semi-transparent (30% opacity)
4. Hover over scrollbar
5. ✅ **Expected**: Becomes slightly more visible (50% opacity)
6. Test in **Light Mode**:
   - ✅ Gray scrollbar on white background
7. Test in **Dark Mode**:
   - ✅ Light gray scrollbar on dark background
8. Test in different browsers:
   - ✅ Chrome/Edge: Custom webkit scrollbar
   - ✅ Firefox: Thin scrollbar
   - ✅ Safari: Custom webkit scrollbar

---

## ✅ Feature 6: No Breaking Changes

### Test Existing Features:
1. **Login**: `/login` - works as before ✅
2. **Signup**: `/signup` - works (now with role selection) ✅
3. **Dashboard**: `/dashboard` - all stats and charts work ✅
4. **Issues List**: `/issues` - view, filter, sort works ✅
5. **Issue Details**: `/issues/[id]` - view, comment, vote works ✅
6. **User Profile**: `/profile` - view, edit works ✅
7. **Admin Panel**: `/admin` - admin features work ✅
8. **Map View**: `/map` - displays issues (now with zoom) ✅
9. **Report Page**: `/report` - alternative report form works ✅
10. **API Endpoints**: All existing APIs respond correctly ✅

---

## 🧪 Integration Tests

### Test Complete User Journey:
1. Sign up as new user (citizen role)
2. Navigate to map page
3. View existing issues on map
4. Click a marker → map zooms
5. Click "Report New Issue"
6. Fill form and submit with photo
7. New issue appears immediately
8. Map zooms to new issue
9. Navigate to `/issues` page
10. Find your issue in the list
11. Click to view details
12. Verify photo, location, AI priority are correct

### Test Complete Admin Journey:
1. Sign up as admin
2. Redirected to `/admin`
3. View all issues dashboard
4. Navigate to `/map`
5. Click on an issue marker
6. View issue details
7. (Future) Assign time estimate
8. Update issue status
9. Verify changes reflect on map

---

## 🔍 Database Verification

### Check Role in Database:
```sql
-- Supabase SQL Editor
SELECT id, name, email, role, created_at 
FROM users 
WHERE email IN ('testuser@example.com', 'testadmin@example.com');
```
✅ **Expected**: Role column shows "citizen" or "admin"

### Check New Issue with AI Metadata:
```sql
SELECT id, title, priority, ai_metadata 
FROM issues 
ORDER BY created_at DESC 
LIMIT 1;
```
✅ **Expected**: 
- `priority` field populated by AI
- `ai_metadata` contains full AI analysis

---

## 📊 Performance Tests

### Map Performance:
1. Navigate to `/map`
2. Check browser console for errors
3. ✅ **Expected**: No JavaScript errors
4. ✅ **Expected**: Map loads in < 3 seconds
5. ✅ **Expected**: Marker click responds immediately
6. ✅ **Expected**: Zoom animation smooth (60fps)

### Form Submission Performance:
1. Report new issue with photo
2. Monitor network tab
3. ✅ **Expected**: Photo uploads in < 5 seconds (depends on size)
4. ✅ **Expected**: Issue creation in < 2 seconds
5. ✅ **Expected**: Map update immediate (< 100ms)

---

## 🐛 Edge Cases to Test

### Location Edge Cases:
- [ ] Deny location permission → Uses default (Goa)
- [ ] Submit without location → Shows error
- [ ] Invalid coordinates → Validation fails

### Form Edge Cases:
- [ ] Very long title (>200 chars) → Truncated or validation
- [ ] Very long description (>2000 chars) → Handled
- [ ] Special characters in title → Properly escaped
- [ ] Upload very large photo (>10MB) → Size limit enforced
- [ ] Upload non-image file → File type validation

### Map Edge Cases:
- [ ] No issues in database → Empty map with user location
- [ ] 100+ issues → Map performance OK
- [ ] Click marker that was just deleted → Handled gracefully
- [ ] Rapid marker clicks → Debounced properly

### Role Edge Cases:
- [ ] Signup without selecting role → Defaults to "citizen"
- [ ] Manually set role="superadmin" in request → Rejected
- [ ] Login with old users (no role) → Backward compatible

---

## ✅ Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (latest) - All features work
- [ ] Firefox (latest) - Thin scrollbars, all features work
- [ ] Safari (latest) - All features work
- [ ] Mobile Chrome - Touch-friendly, responsive
- [ ] Mobile Safari - All features work

---

## 📱 Mobile Testing

### Responsive Design:
1. Open DevTools → Toggle device toolbar
2. Test iPhone 12 Pro (390x844)
3. Test iPad (768x1024)
4. ✅ Map is full width
5. ✅ Report dialog is scrollable
6. ✅ Form inputs are touch-friendly
7. ✅ Markers are easy to tap
8. ✅ Zoom controls accessible

---

## 🎯 Success Criteria

All tests should pass:
- [x] Role selection works for signup
- [x] Users redirect to /dashboard, admins to /admin
- [x] Map markers zoom on click
- [x] Report form submits successfully
- [x] New issues appear on map immediately
- [x] Map auto-zooms to new issues
- [x] AI priority considers health risk & facility importance
- [x] Scrollbars are super thin and barely visible
- [x] No TypeScript errors
- [x] No runtime JavaScript errors
- [x] All existing features work unchanged
- [x] Backward compatible with existing data

---

## 🚨 If Something Breaks

### Debugging Steps:
1. Check browser console for errors
2. Check network tab for failed requests
3. Verify environment variables:
   ```
   GEMINI_API_KEY=your_key_here
   JWT_SECRET=your_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Check Supabase connection
5. Clear browser cache and localStorage
6. Restart dev server: `npm run dev`

### Common Issues:
- **Map not loading**: Check MapTiler API key
- **Photo upload fails**: Check `/api/upload` endpoint
- **AI not working**: Check GEMINI_API_KEY in .env.local
- **Role not saving**: Check database schema has `role` column
- **Zoom not working**: Check map ref is initialized

---

## 📞 Support

If tests fail:
1. Check `IMPLEMENTATION_SUMMARY.md` for details
2. Review code comments in modified files
3. Check TypeScript diagnostics: `npm run type-check`
4. Check build: `npm run build`

---

**Happy Testing! 🎉**

All features have been implemented without breaking existing functionality.