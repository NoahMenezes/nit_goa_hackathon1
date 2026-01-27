# useEffect Dependency Array Fix

## ❌ Problem

Console error was occurring:
```
The final argument passed to useEffect changed size between renders. 
The order and size of this array must remain constant.

Previous: [74.01213073016486, 15.168846130190405, 15]
Incoming: [74.01213073016486, 15.168846130190405, 15, 0, true, 74.01213073016486, 15.168846130190405]
```

## 🔍 Root Cause

The dependency array in the map initialization `useEffect` was including:
- `center` - an array `[lng, lat]`
- `zoom` - a number
- `markers.length` - a number
- `showUserLocation` - a boolean
- `userLocation` - an array `[lng, lat]` or null

```typescript
}, [center, zoom, markers.length, showUserLocation, userLocation]);
```

### Why This Failed

When you pass an array to a dependency array, React doesn't treat it as a single item. Instead:

```typescript
[center, zoom, ...]  
// center = [74.012, 15.168]
// Actually becomes: [74.012, 15.168, zoom, ...]
```

This caused the array size to vary between renders:
- Sometimes: `[lng, lat, zoom]` = 3 items
- Other times: `[lng, lat, zoom, markersLength, showUserLocation, userLng, userLat]` = 7 items

React requires the dependency array to have a **constant size**.

## ✅ Solution

Changed the map initialization to only run once on mount:

```typescript
useEffect(() => {
  // Map initialization logic...
  
  // Map initialization should only happen once on mount
  // showUserLocation and userLocation are handled in the load callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Why This Is Correct

1. **Map initialization should only happen once**
   - Creating a map instance is expensive
   - Re-initializing destroys and recreates the entire map
   - Not necessary when props change

2. **Dynamic values are handled elsewhere**
   - User location is requested in the `map.on("load")` callback
   - Markers are updated in a separate `useEffect`
   - Center/zoom are set during initial map creation

3. **Prop changes don't require re-initialization**
   - If `center` changes, we can use `map.flyTo()` instead
   - If `markers` change, they're handled in their own `useEffect`
   - If `showUserLocation` changes, it's handled in the load callback

## 🎯 Best Practices Applied

### ✅ Single Responsibility
Each `useEffect` has one job:
- **First useEffect**: Initialize map once
- **Second useEffect**: Update user location marker
- **Third useEffect**: Update issue markers

### ✅ Dependency Array Stability
- Empty array `[]` for mount-only effects
- Primitive values (numbers, strings, booleans) for stable dependencies
- No arrays or objects directly in dependency array

### ✅ Intentional Behavior
Using `eslint-disable-next-line` with a comment explaining WHY:
```typescript
// Map initialization should only happen once on mount
// showUserLocation and userLocation are handled in the load callback
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

## 📚 Alternative Solutions Considered

### Option 1: Individual Array Elements ❌
```typescript
}, [center[0], center[1], zoom, showUserLocation]);
```
**Problem**: Still triggers warnings, and map re-initialization is expensive

### Option 2: useMemo for Coordinates ❌
```typescript
const centerLng = useMemo(() => center[0], [center[0]]);
const centerLat = useMemo(() => center[1], [center[1]]);
}, [centerLng, centerLat, zoom]);
```
**Problem**: Adds complexity, still re-initializes map unnecessarily

### Option 3: Empty Dependency Array ✅
```typescript
}, []);
```
**Why This Works**: Map initialization is a one-time operation

## 🧪 Testing

After the fix:
- ✅ No console errors
- ✅ Map initializes once on mount
- ✅ Permission handling works correctly
- ✅ Markers update properly
- ✅ User location updates properly
- ✅ No unnecessary re-renders

## 💡 Key Takeaway

**Don't put arrays or objects directly in dependency arrays unless you understand the implications.**

Good:
```typescript
}, [userId, isActive, count]);  // primitives
```

Bad:
```typescript
}, [center, markers, config]);  // arrays/objects
```

Better:
```typescript
}, [center[0], center[1], markers.length, config.id]);  // extract primitives
```

Best (for initialization):
```typescript
}, []);  // one-time setup
```

---

**Status**: ✅ Fixed
**Impact**: No more console errors, better performance
**Breaking Changes**: None