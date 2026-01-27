# AI-Powered Issue Categorization & Priority Ranking

## Overview

This document explains the AI-powered features implemented in OurStreet for automatic issue categorization, priority ranking, and intelligent analysis using Google Gemini 1.5 Pro/Flash.

## Features Implemented ✅

### 1. **Automatic Issue Categorization**
- AI analyzes issue title and description to determine the most appropriate category
- Supports all 10 issue categories: pothole, streetlight, garbage, water_leak, road, sanitation, drainage, electricity, traffic, other
- Fallback to rule-based categorization if AI is unavailable

### 2. **Intelligent Priority Ranking**
- AI assigns priority levels based on:
  - **Severity**: How severe is the damage/impact?
  - **Urgency**: How quickly does this need attention?
  - **Public Safety**: Risk to citizens
  - **Impact Scope**: Number of people affected
  - **Escalation Potential**: Could the issue get worse?
- Priority levels: `critical`, `high`, `medium`, `low`

### 3. **AI Confidence Scoring**
- Each AI prediction comes with a confidence score (0-100%)
- Low confidence triggers fallback mechanisms
- Users can see AI confidence before accepting suggestions

### 4. **Smart Suggestions**
- AI can suggest improved issue titles for clarity
- Generates relevant tags for better searchability
- Provides reasoning for categorization decisions

### 5. **User Choice: Manual vs AI**
- Users can toggle between manual and AI-powered categorization
- Manual mode: Traditional category dropdown selection
- AI mode: Automatic analysis upon issue submission
- Hybrid mode: Get AI suggestions but manually confirm/override

### 6. **Frequency & Location Analysis**
- System tracks issue density in areas
- High-frequency areas get boosted urgency scores
- Helps identify problem hotspots

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│              (app/report/page.tsx)                          │
│  • Manual/AI toggle switch                                  │
│  • AI suggestion display                                    │
│  • Apply/Override controls                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Layer                          │
│              (app/api/issues/route.ts)                      │
│              (app/api/ai/categorize/route.ts)               │
│  • Request validation                                       │
│  • AI service orchestration                                 │
│  • Fallback handling                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Layer                         │
│              (lib/ai/service.ts)                            │
│  • Gemini API integration                                   │
│  • Prompt engineering                                       │
│  • Response parsing                                         │
│  • Rule-based fallback                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Google Gemini API                           │
│        (generativelanguage.googleapis.com)                  │
│  • Natural language understanding                           │
│  • Multi-factor analysis                                    │
│  • JSON response generation                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### 2. Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # or gemini-1.5-pro for better accuracy

# Optional: Configure timeout and retry settings
AI_REQUEST_TIMEOUT=10000
AI_MAX_RETRIES=2
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Verify AI Service

Check if AI is available:

```bash
curl http://localhost:3000/api/ai/categorize
```

Response:
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "AI categorization service is available"
  }
}
```

---

## Usage Guide

### For Citizens

#### Option 1: AI-Powered Categorization (Recommended)

1. Navigate to `/report`
2. Fill in **Issue Title** and **Description**
3. Toggle **"AI-Powered Categorization"** switch to ON
4. The system will automatically analyze your issue when you submit
5. AI will determine the best category and priority

#### Option 2: Get AI Suggestions First

1. Navigate to `/report`
2. Fill in **Issue Title** and **Description**
3. Keep AI toggle OFF
4. Click **"Get AI Suggestion"** button
5. Review AI recommendation (shows category, priority, confidence)
6. Click **"Apply Suggestion"** or manually override
7. Submit your report

#### Option 3: Fully Manual

1. Navigate to `/report`
2. Fill in all fields including manual category selection
3. Keep AI toggle OFF
4. Don't click "Get AI Suggestion"
5. Submit your report (uses rule-based priority assignment)

### For Developers

#### Use AI Categorization Programmatically

```typescript
import { categorizeIssue } from '@/lib/ai/service';

const result = await categorizeIssue({
  title: 'Broken street light on Main Road',
  description: 'The street light has been non-functional for 3 days, making the area unsafe at night',
  location: 'Panjim - Fontainhas'
});

console.log(result);
// {
//   category: 'streetlight',
//   priority: 'high',
//   confidence: 0.95,
//   reasoning: 'Street light malfunction affecting public safety at night',
//   suggestedTitle: 'Non-functional street light on Main Road - Safety hazard',
//   tags: ['lighting', 'safety', 'urgent']
// }
```

#### Create Issue with AI

```typescript
const response = await fetch('/api/issues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Pothole on highway',
    description: 'Large pothole causing accidents',
    category: 'pothole', // Will be overridden if useAI is true
    location: 'Panjim',
    coordinates: { lat: 15.4909, lng: 73.8278 },
    useAI: true, // Enable AI categorization
    beforePhotoUrls: ['url1', 'url2']
  })
});

const data = await response.json();
// data.data will include aiMetadata with AI analysis results
```

---

## API Endpoints

### POST `/api/ai/categorize`

Analyze issue text and get AI suggestions without creating an issue.

**Request:**
```json
{
  "title": "Broken street light",
  "description": "Street light not working for 3 days",
  "location": "Panjim - Fontainhas"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "streetlight",
    "priority": "high",
    "confidence": 0.92,
    "reasoning": "Street lighting issue affecting public safety",
    "suggestedTitle": "Non-functional street light - 3 days",
    "tags": ["lighting", "safety", "maintenance"]
  }
}
```

### POST `/api/issues` (with AI)

Create an issue with AI categorization.

**Request:**
```json
{
  "title": "Water pipe burst",
  "description": "Major water leak flooding the street",
  "category": "water_leak",
  "location": "15.4909, 73.8278",
  "coordinates": { "lat": 15.4909, "lng": 73.8278 },
  "useAI": true,
  "beforePhotoUrls": ["url1", "url2"]
}
```

**Response includes AI metadata:**
```json
{
  "success": true,
  "data": {
    "id": "issue123",
    "title": "Water pipe burst",
    "category": "water_leak",
    "priority": "critical",
    "aiMetadata": {
      "usedAI": true,
      "aiCategory": "water_leak",
      "aiPriority": "critical",
      "confidence": 0.98,
      "reasoning": "Major infrastructure failure with immediate impact",
      "tags": ["water", "emergency", "flooding"],
      "manualOverride": false
    }
  }
}
```

---

## AI Analysis Factors

The AI considers multiple factors when categorizing issues:

### 1. **Severity Score (0-100)**
- Extent of damage
- Infrastructure impact
- Property/asset value affected

### 2. **Urgency Score (0-100)**
- Time sensitivity
- Rate of deterioration
- Immediate action required

### 3. **Safety Risk Assessment**
- Danger to public
- Accident potential
- Health hazards

### 4. **Impact Scope**
- Number of people affected
- Essential service disruption
- Community importance

### 5. **Contextual Factors**
- Location type (residential, commercial, highway)
- Weather conditions (monsoon season)
- Historical issue patterns

---

## Priority Mapping

| Urgency Score | Priority Level | Response Time | Examples |
|--------------|----------------|---------------|----------|
| 85-100 | **Critical** | Immediate (< 4 hours) | Major water leaks, electrical hazards, road accidents |
| 60-84 | **High** | Same day (< 24 hours) | Significant potholes, broken traffic signals, sewage overflow |
| 30-59 | **Medium** | 2-5 days | Street lights, moderate garbage, minor road damage |
| 0-29 | **Low** | 1-2 weeks | Cosmetic issues, minor improvements |

---

## Fallback Mechanisms

### When AI Fails
The system has multiple fallback layers:

1. **Retry Logic**: Automatically retries API calls (up to 2 times)
2. **Rule-Based Fallback**: Uses keyword matching if AI is unavailable
3. **Default Values**: Safe defaults (category: 'other', priority: 'medium')
4. **User Notification**: Informs user if AI is unavailable

### Rule-Based Categorization
When Gemini API is unavailable, the system uses keyword matching:

```typescript
// Example rule-based logic
if (description.includes('pothole') || description.includes('hole in road')) {
  category = 'pothole';
  priority = 'medium';
}
if (description.includes('urgent') || description.includes('dangerous')) {
  priority = 'high';
}
```

---

## Best Practices

### For Users

1. **Be Descriptive**: More detail = better AI analysis
   - ❌ "Street issue"
   - ✅ "Large pothole on Main Street causing vehicle damage"

2. **Include Context**: Location, time, impact
   - ✅ "Street light broken for 3 days, making area unsafe at night"

3. **Review AI Suggestions**: Always check AI recommendations before submitting

4. **Use Photos**: Visual evidence helps (future: AI image analysis)

### For Developers

1. **Handle Errors Gracefully**: Always have fallback logic
2. **Log AI Interactions**: Track confidence scores and accuracy
3. **Monitor API Usage**: Gemini has rate limits
4. **Test Fallbacks**: Ensure system works without AI
5. **Validate AI Output**: Don't trust AI blindly, validate responses

---

## Troubleshooting

### AI Service Not Available

**Symptom**: "AI service is not configured" error

**Solutions**:
1. Check if `GEMINI_API_KEY` is set in `.env.local`
2. Verify API key is valid (test at Google AI Studio)
3. Check API quota and rate limits
4. System will use fallback categorization automatically

### Low Confidence Scores

**Symptom**: AI returns confidence < 0.5

**Causes**:
- Vague or unclear descriptions
- Unusual issue types
- Ambiguous language

**Solutions**:
- Provide more detailed descriptions
- Include specific keywords
- Manual override is recommended

### Incorrect Categorization

**Symptom**: AI suggests wrong category

**Actions**:
1. Use manual override
2. Report feedback to improve prompts
3. System learns from corrections over time

---

## Performance & Costs

### API Usage

- **Model**: Gemini 1.5 Flash (default) - Fast and cost-effective
- **Alternative**: Gemini 1.5 Pro - More accurate but slower/costlier
- **Request Size**: ~500-1000 tokens per categorization
- **Response Time**: 1-3 seconds typically

### Cost Estimation

Gemini 1.5 Flash (as of 2024):
- Free tier: 15 requests/minute, 1500 requests/day
- Paid tier: Very affordable (~$0.00015/1k tokens)

For 1000 issues/month:
- Estimated tokens: 1M tokens
- Estimated cost: ~$0.15/month (negligible)

### Caching Strategy

To reduce API calls:
1. Cache common categorizations
2. Batch similar issues
3. Use rule-based for obvious cases
4. Implement request throttling

---

## Future Enhancements

### Planned Features

1. **Image Analysis**
   - AI analyzes uploaded photos
   - Visual recognition of issue types
   - Damage severity assessment from images

2. **Duplicate Detection**
   - AI identifies duplicate reports
   - Semantic similarity matching
   - Geographic clustering

3. **Smart Routing**
   - Auto-assign to appropriate authority
   - Predict resolution time
   - Suggest similar resolved cases

4. **Trend Analysis**
   - Identify emerging issues
   - Predict seasonal patterns
   - Proactive alerting

5. **Multi-language Support**
   - Support Konkani, Hindi, Marathi
   - Auto-translation of descriptions
   - Language-aware categorization

---

## Security & Privacy

### Data Handling

1. **No Personal Data**: AI only analyzes issue descriptions, not user info
2. **Anonymization**: Location data is fuzzy (ward-level, not exact GPS in AI)
3. **No Storage**: Gemini doesn't store conversation data by default
4. **Encryption**: All API calls use HTTPS
5. **API Key Security**: Never expose API key in frontend

### Compliance

- GDPR compliant (no personal data processing)
- Data retention policies followed
- User consent for AI analysis (toggle)
- Transparent AI usage (shown to users)

---

## Testing

### Manual Testing Checklist

- [ ] AI toggle works correctly
- [ ] "Get AI Suggestion" button triggers analysis
- [ ] AI suggestions display correctly (category, priority, confidence)
- [ ] "Apply Suggestion" updates form fields
- [ ] Manual override works (user can change AI category)
- [ ] Fallback works when AI is disabled
- [ ] Error messages are clear
- [ ] aiMetadata is stored in database

### Test Cases

```typescript
// Test 1: High-priority emergency
const test1 = await categorizeIssue({
  title: 'Major water main burst flooding street',
  description: 'Massive water leak, road flooded, traffic blocked'
});
// Expected: category='water_leak', priority='critical'

// Test 2: Low-priority cosmetic
const test2 = await categorizeIssue({
  title: 'Small crack in sidewalk',
  description: 'Minor cosmetic crack, no tripping hazard'
});
// Expected: category='road', priority='low'

// Test 3: Ambiguous description
const test3 = await categorizeIssue({
  title: 'Problem on street',
  description: 'There is an issue'
});
// Expected: Lower confidence, possibly 'other' category
```

---

## Support & Feedback

### Report Issues
- GitHub Issues: [Your Repo URL]
- Email: support@ourstreet.com

### Contribute
- Improve prompts in `lib/ai/service.ts`
- Add test cases
- Enhance fallback logic

### AI Accuracy Feedback
Help us improve by reporting:
- Incorrect categorizations
- Low confidence predictions
- Edge cases

---

## Version History

### v1.0 (Current)
- ✅ Gemini 1.5 Flash/Pro integration
- ✅ Automatic categorization
- ✅ Priority ranking
- ✅ Confidence scoring
- ✅ Manual/AI toggle
- ✅ Fallback mechanisms
- ✅ AI metadata storage

### Planned v2.0
- 🔄 Image analysis
- 🔄 Duplicate detection
- 🔄 Multi-language support
- 🔄 Trend prediction

---

## Conclusion

The AI-powered categorization system significantly improves issue reporting by:

1. **Reducing User Effort**: Auto-categorization saves time
2. **Improving Accuracy**: AI considers multiple factors
3. **Consistent Priority**: Standardized urgency assessment
4. **Better Resource Allocation**: Authorities can prioritize effectively
5. **Enhanced Insights**: Metadata enables analytics

**Implementation Status**: ✅ **100% Complete**

All core requirements from the hackathon spec are implemented:
- ✅ AI/ML model integration (Gemini)
- ✅ Automatic classification based on text
- ✅ Priority scores based on severity, frequency, and location
- ✅ User choice between manual and AI categorization

---

**Need Help?** Check the troubleshooting section or contact the development team.