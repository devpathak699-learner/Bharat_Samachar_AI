# 🏗️ Design Document
## Bharat Samachar - System Architecture

**VIT Bhopal** | AI for Bharat 2026 | Contact: dev.24bce10361@vitbhopal.ac.in

---

## 📐 System Architecture (High-Level)

```
┌─────────────────────────────────────────────────────┐
│                  USER INTERFACE                     │
│         Next.js Web App + Mobile App                │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────┼─────────────────────────────────┐
│              API GATEWAY (FastAPI)                  │
│  Authentication | Rate Limiting | Routing           │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼──────┐ ┌──▼─────┐ ┌──▼──────────┐
│ Translation  │ │ Video  │ │Fact-Check   │
│   Service    │ │  Gen   │ │  Service    │
└───────┬──────┘ └──┬─────┘ └──┬──────────┘
        │           │           │
        └───────────┼───────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼────┐  ┌───────▼─────┐  ┌─────▼──────┐
│Gemini  │  │  ElevenLabs │  │Stability AI│
│  API   │  │   (Voice)   │  │  (Images)  │
└────────┘  └─────────────┘  └────────────┘

┌───────────────────────────────────────────────┐
│             DATA LAYER                        │
│  PostgreSQL | Redis Cache | S3 Storage        │
└───────────────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. **Frontend (Next.js)**
- **What**: Web app for users to submit articles & view results
- **Tech**: Next.js 14, React, TypeScript, Tailwind CSS
- **Key Pages**: 
  - Dashboard (upload article, select languages)
  - Results view (side-by-side original vs translated)
  - History (past translations)

### 2. **Backend (FastAPI)**
- **What**: API server handling all requests
- **Tech**: Python FastAPI, Celery (background jobs)
- **Key Features**:
  - Parse articles from URLs
  - Queue translation/video tasks
  - Serve results via REST API

### 3. **Translation Service (Our Secret Sauce 🔥)**
- **What**: Cultural context-aware translation
- **How it works**:
  1. Extract article content
  2. Identify cultural elements (idioms, references)
  3. Send to Gemini with cultural context prompt
  4. Replace idioms with regional equivalents
  5. Return culturally-adapted translation

**Example Prompt to Gemini**:
```
Translate this to Hindi, but replace:
- "Raining cats and dogs" → "मूसलाधार बारिश"
- "Super Bowl" → "IPL Final"
Maintain natural fluency, not word-for-word.
```

### 4. **Video Generation Pipeline**
1. **Script**: AI summarizes article into 30-sec script (10s)
2. **Voiceover**: ElevenLabs generates audio in target language (30s)
3. **Visuals**: Stable Diffusion creates 3-4 contextual images (90s)
4. **Assembly**: FFmpeg combines images + audio → MP4 (30s)
5. **Upload**: Save to S3, return URL (10s)

**Total time**: ~3 minutes per video

### 5. **Fact-Checking Service**
- Extracts claims from article using NLP
- Cross-references with trusted sources:
  - PIB (Press Information Bureau) - web scraping
  - Google Fact Check API
  - Manual verification for high-stakes claims
- Assigns credibility score (0-100)
- Flags suspicious content for manual review

---

## 💾 Database Design (Simplified)

### PostgreSQL Tables

**articles**
- id, url, title, content, language, category, created_at
- Stores original articles

**translations**
- id, article_id, target_language, translated_content
- cultural_adaptations (JSON: which idioms replaced)
- confidence_score, created_at

**videos**  
- id, article_id, language, video_url (S3), duration, status
- Stores generated videos

**users**
- id, email, password_hash, subscription_tier, api_key
- User accounts & auth

**cultural_mappings** (our secret sauce 🔥)
- id, source_phrase, target_language, adapted_phrase, context
- 1,000+ idiom/reference pairs (growing via crowdsourcing)

### Redis Cache
- Translation cache (24hr TTL) → 60% cost savings
- Cultural mapping cache (7 day TTL)
- Session storage (JWT tokens)

---

## 🔐 Security

**Authentication**: JWT tokens (15-min access + 7-day refresh)  
**Data Protection**: 
- TLS 1.3 in transit
- AWS RDS encryption at rest (AES-256 equivalent)
- S3 server-side encryption for media files
**API Security**: Rate limiting (10/hr free, 100/hr paid)  
**Privacy**: 
- Data stored in India (AWS Mumbai region)
- GDPR-compliant data deletion
- No content stored beyond 30 days (unless user saves)

---

## 🚀 Deployment

**Cloud**: AWS  
**Frontend**: Vercel (Next.js)  
**Backend**: AWS ECS (Docker containers)  
**Database**: AWS RDS (PostgreSQL) + ElastiCache (Redis)  
**Storage**: S3 for videos/images  
**CDN**: CloudFront for global delivery

**Auto-Scaling**: Backend scales 1-10 instances based on CPU

---

## 📈 Performance

### Speed Targets
- Article parsing: <5 sec
- Translation: <30 sec per language
- Video generation: <3 min
- API response: <200ms (cached), <2s (uncached)

### Scalability
- Handle 1,000 concurrent users (MVP)
- Process 10,000 articles/day (Year 1 target)
- 99.5% uptime (MVP), 99.9% (production)

### Cost Optimization
- **Cache aggressively**: 60% reduction in AI API calls
- **Batch requests**: Process multiple translations together
- **Spot instances**: 70% savings on video workers

### Cost Breakdown (per article)
- Gemini API: ₹20-30
- ElevenLabs TTS: ₹15-20
- Stable Diffusion: ₹10-15
- Infrastructure: ₹5-10
**Total**: ~₹50-75/article | **Selling price**: ₹200-500/article

---

## 🎨 UI/UX Flow

```
Step 1: User pastes article URL
    ↓
Step 2: Select target languages (checkboxes)
    ↓
Step 3: Click "Translate" → Shows progress bar
    ↓
Step 4: View results:
    - Tabs for each language
    - Side-by-side original vs translated
    - Highlight cultural adaptations
    - Embedded video player
    - Download buttons
```

**Design Principles**: 
- Clean, minimal UI  
- Real-time progress updates  
- Mobile-first responsive design

---

## 🔄 Data Flow Example

**User submits "https://example.com/article" for Hindi translation:**

1. **Frontend** → POST /api/v1/translate
   ```json
   {
     "article_url": "https://example.com/article",
     "target_languages": ["hi"],
     "generate_video": true
   }
   ```

2. **Backend** → Parse article, queue Celery task
   ```python
   task = translate_with_context.delay(article_id, "hi")
   return {"task_id": task.id, "status": "processing"}
   ```

3. **Translation Service** →
   - Detect: "Raining cats and dogs" (idiom)
   - Gemini translates with cultural context
   - Returns: "मूसलाधार बारिश हो रही है"

4. **Video Service** → Generate 30-sec video

5. **Frontend** polls /api/v1/translate/{task_id}/status
   - Shows progress: 0% → 50% → 100%
   - Displays result when ready

---

## 🧪 Testing Strategy

**Unit Tests**: Each service tested independently (pytest)  
**Integration Tests**: Full flow from API → AI → Database  
**Load Tests**: Simulate 1000 users with Locust  
**Cultural Validation**: 
- 10 native speakers per language (5 languages = 50 testers)
- Test 100 sample translations
- Target: 90%+ approval rate

**Target**: 80%+ code coverage for backend

---

## 📊 Monitoring

**Metrics we track**:
- API response time (Datadog)
- Error rates by endpoint
- AI API costs per translation
- Translation accuracy scores
- User engagement

**Alerts**: 
- If response time > 5 sec
- If error rate > 1%
- If costs spike unexpectedly

---

## 🗺️ MVP Scope (What we'll build first)

**Phase 1 - MVP (2 weeks)**:
- ✅ Article URL input
- ✅ Translation to 5 languages (Hi, Ta, Bn, Mr, Te)
- ✅ Cultural adaptation for 100 common idioms
- ✅ Basic video generation (30-sec summaries)
- ✅ Simple web UI (Next.js)

**Phase 2 - Beta (1-2 months)**:
- All 22 languages
- Cultural database expanded to 1,000 mappings
- Improved video quality (HD, better visuals)
- User accounts + billing (Stripe integration)
- Fact-checking integration

**Phase 3 - Production (3-6 months)**:
- Real-time translation API
- Voice cloning (preserve original speaker's voice)
- Mobile app (React Native)
- Analytics dashboard for publishers

---

## 💡 Technical Innovations

1. **Cultural Mapping Database**: 
   - Start with 1,000 curated idiom/reference pairs
   - Crowdsource additions (users can suggest mappings)
   - Target: 10,000+ pairs by Year 1
2. **Multi-pass Translation**: Not single LLM call, but analyze → adapt → translate → validate
3. **Smart Caching**: Cache by content hash, not just exact matches
4. **Async Everything**: All heavy tasks run in background (Celery workers)

---

## 🔮 Scalability Path

**MVP**: 100 articles/day  
**Month 1**: 1,000 articles/day  
**Month 6**: 10,000 articles/day  
**Year 1**: 25,000 articles/day

**How we'll scale**:
- Horizontal scaling (auto-scaling ECS tasks)
- Database read replicas (PostgreSQL)
- CDN for media delivery (CloudFront)
- Redis cluster for distributed cache

---

## 📚 Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js + React | Fast, SEO-friendly, modern |
| **Backend** | FastAPI + Python | Fast API dev, async support |
| **Database** | PostgreSQL | Reliable, ACID compliant |
| **Cache** | Redis | Fast, simple, proven |
| **Queue** | Celery | Standard for Python async tasks |
| **AI** | Gemini + ElevenLabs + Stable Diffusion | Best-in-class models |
| **Cloud** | AWS | Scalable, India region available |
| **Deployment** | Docker + ECS | Easy scaling, modern DevOps |

---

## ✅ Design Checklist

- [x] Architecture handles 1000+ concurrent users
- [x] All data encrypted (at rest & in transit)
- [x] Scalable horizontally
- [x] Cost-optimized with caching
- [x] Modular design (easy to add features)
- [x] API-first (can build mobile app later)
- [x] India data residency compliant

---

**This is the simplified design. Full technical specs available on request!** 📐

---

**Version**: 1.0 | **Date**: Feb 6, 2026 | **Contact**: dev.24bce10361@vitbhopal.ac.in
