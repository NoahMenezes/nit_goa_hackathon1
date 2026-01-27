# Interactive Map - Location Permission Handling

## Overview
The interactive map component now features comprehensive location permission handling with proper UI states for better user experience.

## Features Implemented

### 1. **Location Permission States**
The map now tracks and responds to four permission states:
- `pending` - Initial state while checking permissions
- `prompt` - Browser is requesting permission from user
- `granted` - User has allowed location access
- `denied` - User has denied location access

### 2. **Visual Feedback**

#### **Pending/Prompt State**
- Map is blurred out with `blur-sm` effect
- Overlay with location icon and permission request message
- "Waiting for permission..." animated text
- Clean, centered UI with semi-transparent backdrop

#### **Denied State**
- Map is completely covered with overlay
- Red location icon with cross
- Bold message: **"Allow access to location to continue"**
- Helpful instructions to enable permissions in browser settings
- "Refresh Page" button to retry after enabling permissions

#### **Granted State**
- Map loads normally without overlays
- User location shown with blue pulsing marker
- Full map functionality available

### 3. **User Experience Flow**

```
1. User visits map page
   ↓
2. Map starts loading (loading spinner shown)
   ↓
3. Browser requests location permission (blurred map + overlay)
   ↓
4a. User ALLOWS → Map loads, user location shown, overlay removed
4b. User DENIES → Denial message shown with refresh option
```

## Code Changes

### `components/interactive-map.tsx`

#### New State Variable
```typescript
const [locationPermissionState, setLocationPermissionState] = useState<
  "pending" | "granted" | "denied" | "prompt"
>("pending");
```

#### Permission Checking
- Uses `navigator.permissions.query()` to check permission state
- Listens for permission state changes
- Fallback for browsers without Permissions API

#### Conditional Loading
- Map loading state now considers permission status
- Doesn't hide loading until permission is resolved (if required)

#### Visual States
1. **Blur Effect**: Applied when permission is pending/prompt
2. **Permission Prompt Overlay**: Shows location icon and request message
3. **Denial Overlay**: Shows error state with clear message and action button
4. **Loading Overlay**: Standard loading spinner

## Usage

### Default Behavior (with location permission)
```tsx
<InteractiveMap
  center={[73.8278, 15.4909]}
  zoom={12}
  markers={issueMarkers}
  showUserLocation={true}
/>
```
This will:
- Request location permission on load
- Show permission UI states
- Display user location when granted

### Without Location Permission Check
```tsx
<InteractiveMap
  center={[73.8278, 15.4909]}
  zoom={12}
  markers={issueMarkers}
  showUserLocation={false}
/>
```
This will:
- Skip permission request
- Load map immediately
- No permission overlays

### With Manual User Location
```tsx
<InteractiveMap
  center={[73.8278, 15.4909]}
  zoom={12}
  markers={issueMarkers}
  showUserLocation={true}
  userLocation={[73.8278, 15.4909]}
/>
```
This will:
- Skip automatic permission request
- Use provided location
- No permission overlays

## Browser Compatibility

- **Modern Browsers**: Full support with Permissions API
- **Older Browsers**: Fallback to prompt state, still functional
- **No Geolocation API**: Shows denial state immediately

## Styling Details

### Blur Effect
- Uses Tailwind's `blur-sm` class
- Applied conditionally based on permission state
- Smooth transition with `transition-all duration-300`

### Overlays
- Semi-transparent backdrop: `bg-white/80 dark:bg-gray-900/80`
- Backdrop blur: `backdrop-blur-md`
- Responsive design: `max-w-md p-6`

### Icons
- Location icon (permission request): Blue (#3b82f6)
- Denied icon: Red (#ef4444)
- SVG icons with proper sizing and spacing

### Animations
- Loading spinner: `animate-spin`
- "Waiting" text: `animate-pulse`
- Smooth transitions on all state changes

## Testing

### To Test Permission States:

1. **Grant Permission**:
   - Visit map page
   - Click "Allow" when browser prompts
   - Verify: Map loads, user location shown

2. **Deny Permission**:
   - Visit map page
   - Click "Block" or "Deny" when browser prompts
   - Verify: Denial message shown with "Allow access to location to continue"

3. **Reset Permissions**:
   - Chrome: Click lock icon → Site settings → Clear permissions
   - Firefox: Click lock icon → Clear permissions
   - Safari: Settings → Privacy → Location Services → [Your Site] → Ask

4. **Denied State Actions**:
   - Enable location in browser settings
   - Click "Refresh Page" button
   - Verify: Permission prompt appears again

## Error Handling

- Graceful fallback if Permissions API unavailable
- Catches geolocation errors (denied, timeout, unavailable)
- Separate error state for map loading failures
- All errors have user-friendly messages and recovery options

## Future Enhancements

- [ ] Add "Allow Location" button to manually trigger permission request
- [ ] Show mini-tutorial on how to enable location in different browsers
- [ ] Fallback to IP-based location if permission denied
- [ ] Remember user's choice to not ask again
- [ ] Add analytics to track permission grant/deny rates

## Related Files

- `components/interactive-map.tsx` - Main component
- `app/map/page.tsx` - Map page implementation
- `app/report/page.tsx` - Uses map for location selection

---

**Last Updated**: 2025
**Version**: 1.0.0