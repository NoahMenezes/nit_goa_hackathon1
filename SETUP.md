# Environment Setup Guide

This guide will help you set up the required environment variables for the MapTiler interactive maps and ElevenLabs voice agent features.

## Required Environment Variables

### MapTiler API Key (for Interactive Maps)

1. Go to [MapTiler Cloud](https://cloud.maptiler.com/)
2. Create a free account or sign in
3. Go to your account dashboard
4. Navigate to "API Keys" section
5. Create a new API key or copy your existing key

Add this to your `.env.local` file:
```
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here
```

### ElevenLabs Voice Agent (Already Configured)

The ElevenLabs voice agent is already configured with the following environment variables:

```
ELEVENLABS_AI_AGENT=agent_8701kfjzrrhcf408keqd06k3pryw
NEXT_PUBLIC_AGENT_ID=agent_8701kfjzrrhcf408keqd06k3pryw
```

## Complete .env.local Setup

Create a `.env.local` file in your project root with the following content:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=citypulse-secret-key-change-in-production

# MapTiler API Key (Required for interactive maps)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key_here

# ElevenLabs Voice Agent (Pre-configured)
ELEVENLABS_AI_AGENT=agent_8701kfjzrrhcf408keqd06k3pryw
NEXT_PUBLIC_AGENT_ID=agent_8701kfjzrrhcf408keqd06k3pryw

# Development Mode
NODE_ENV=development
```

## New Features Added

### 1. Interactive Map Component

A new MapTiler-based map component has been added to the project:

- **Location**: `components/ui/map.tsx`
- **Usage**: `components/my-map.tsx`
- **Features**: 
  - Interactive navigation controls
  - Geolocation support
  - Customizable center and zoom
  - Real-time map rendering

**Usage Example**:
```tsx
import { MyMap } from "@/components/my-map";

export function MapSection() {
  return <MyMap />;
}
```

### 2. Voice Agent Integration

ElevenLabs voice agent has been integrated with an interactive orb visualization:

- **Location**: `app/voice-agent/page.tsx`
- **Component**: `components/elevenlabs-voice-agent.tsx`
- **Features**:
  - Real-time voice conversation
  - Visual orb that responds to speech
  - WebSocket connection to ElevenLabs API
  - Audio volume monitoring
  - Speech-to-text transcription

**Navigation**: The voice agent is accessible via the main navigation menu.

### 3. Updated Navigation

The navigation has been updated to include:
- Voice Agent page (`/voice-agent`)
- Enhanced map integration

## Installation Steps

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Add your MapTiler API key
   - ElevenLabs keys are pre-configured

3. **Run the development server**:
```bash
npm run dev
```

4. **Access new features**:
   - Navigate to `/voice-agent` for the voice assistant
   - Visit `/map` to see both map implementations
   - Check `/dashboard` for the integrated map view

## Dependencies Added

The following new dependencies were added to support these features:

```json
{
  "three": "latest",
  "@react-three/fiber": "latest",
  "@react-three/drei": "latest",
  "@types/three": "latest"
}
```

## Components Added

### Map Components
- `components/ui/map.tsx` - Core MapTiler map component
- `components/my-map.tsx` - Pre-configured map instance

### Voice Agent Components  
- `components/ui/orb.tsx` - 3D animated orb visualization
- `components/elevenlabs-voice-agent.tsx` - Complete voice agent interface
- `components/ui/waveform.tsx` - Audio waveform component
- `components/ui/audio-player.tsx` - Audio player utilities

### Pages
- `app/voice-agent/page.tsx` - Voice agent interface page

## Troubleshooting

### Map Not Loading
- Verify your MapTiler API key is correct
- Check browser console for API errors
- Ensure the key has proper permissions

### Voice Agent Issues
- Allow microphone access when prompted
- Check browser compatibility (Chrome/Firefox recommended)
- Verify network connection for WebSocket

### Dependencies Issues
```bash
# If you encounter Three.js issues, try:
npm install --force

# Or delete node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
```

## Browser Requirements

- **Maps**: Modern browsers with WebGL support
- **Voice Agent**: Browsers with WebRTC and microphone access
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+

## API Rate Limits

- **MapTiler**: Free tier includes 100,000 map loads/month
- **ElevenLabs**: Check your account limits for voice processing

For production deployment, ensure all environment variables are properly configured in your hosting platform.