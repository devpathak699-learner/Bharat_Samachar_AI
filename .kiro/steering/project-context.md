# Bharat Samachar - Project Context

## Project Overview
Bharat Samachar is an AI-powered content localization engine that transforms English/Hindi content into 22 Indian languages with cultural adaptation and auto-generates videos. Built for AI for Bharat 2026 Hackathon by VIT Bhopal.

## Core Mission
Transform digital content for 700M+ regional language speakers in India through culturally-aware translation (not literal word-for-word like Google Translate).

## Key Differentiator
**Cultural Context AI** - We don't just translate, we adapt:
- "Raining cats and dogs" → "मूसलाधार बारिश" (torrential rain)
- "Super Bowl excitement" → "IPL Final जैसा उत्साह"
- "Black Friday deals" → "Diwali Sale जैसे ऑफर"

## Target Languages (MVP: 5, Full: 22)
**MVP Priority**: Hindi, Tamil, Bengali, Marathi, Telugu (covers 450M+ speakers)
**Full**: All 22 scheduled Indian languages

## Tech Stack
- **AI/ML**: Google Gemini Pro (translation), ElevenLabs TTS (voice), Stable Diffusion (images)
- **Backend**: Python FastAPI, Celery (async tasks)
- **Frontend**: Next.js 14, React, TypeScript
- **Database**: PostgreSQL (main), Redis (cache)
- **Storage**: AWS S3 (videos/images)
- **Cloud**: AWS Mumbai region (data sovereignty)

## Key Features
1. Cultural context translation (22 languages)
2. Auto video generation (30-60 sec summaries)
3. Fact-checking with credibility scores
4. Multi-modal output (text, video, audio, social posts)

## Performance Targets
- Translation: <30 seconds per language
- Video generation: <3 minutes
- Cultural adaptation accuracy: 90%+
- API response: <200ms (cached), <2s (uncached)

## Business Model
- Starter: ₹5,000/month (100 articles, 5 languages)
- Professional: ₹25,000/month (500 articles, 15 languages, video)
- Enterprise: ₹50,000+/month (unlimited, 22 languages, API access)

## Contact
dev.24bce10361@vitbhopal.ac.in
