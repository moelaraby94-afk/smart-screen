# 11 — AI Services Audit

> **Objective:** Evaluate the AI/ML capabilities: content generation, smart scheduling, design suggestions, analytics insights, and LLM integration.

---

## 1. Current State

**There are no AI services implemented in the backend.** No `domains/ai/` module exists. No LLM integration, no content generation endpoints, no smart scheduling algorithms, no design suggestions, no intelligent analytics. The project is described as "Enterprise AI-powered cloud signage" but the backend has zero AI functionality.

---

## 2. What Exists

### Indirect AI-Adjacent Features
- **Prayer times calculation** (`PrayerTimesService`) — Astronomical calculation, not AI
- **Ramadan mode** (`RamadanService`) — Date-based activation, not AI
- **Schedule overlap detection** (`SchedulingService`) — Algorithmic, not AI
- **Campaign approval workflow** — Human-in-the-loop, no AI moderation

### No AI Infrastructure
- No OpenAI/Anthropic/Google AI SDK integration
- No prompt templates or prompt engineering
- No embedding storage or vector database
- No model selection or fallback logic
- No AI rate limiting or cost tracking
- No AI response caching
- No AI safety guardrails or content filtering

---

## 3. What Is Missing (Everything)

### Content Generation
1. **No AI text generation** — No endpoint to generate ticker text, announcements, or news headlines
2. **No AI image generation** — No DALL-E/Stable Diffusion integration for creating visuals
3. **No AI template suggestions** — No "suggest a template for my use case" endpoint
4. **No AI content rewriting** — No "improve this text" or "translate to Arabic" endpoint
5. **No AI brand kit generation** — No automatic color palette or font suggestions

### Smart Scheduling
6. **No optimal schedule suggestions** — No "when should I display this content?" endpoint
7. **No audience analytics** — No foot traffic prediction, no dwell time analysis
8. **No content performance prediction** — No "which content will perform best?" endpoint
9. **No automatic schedule optimization** — No AI-driven schedule adjustments based on performance

### Design Intelligence
10. **No AI canvas design suggestions** — No "arrange these elements optimally" endpoint
11. **No AI color contrast checking** — No accessibility-aware design suggestions
12. **No AI image cropping** — No smart crop for different screen orientations
13. **No AI logo detection** — No automatic brand element identification

### Analytics & Insights
14. **No AI-powered analytics** — No "why did this screen underperform?" endpoint
15. **No anomaly detection** — No automatic detection of unusual screen behavior
16. **No content recommendations** — No "content you should display next" endpoint
17. **No audience segmentation** — No AI-based audience profiling

### Natural Language
18. **No natural language schedule creation** — No "show this every Monday at 9am" → schedule
19. **No chatbot / assistant** — No conversational interface for managing signage
20. **No voice commands** — No voice-to-action for screen management

---

## 4. Problems

1. **Product positioning mismatch** — The product claims to be "AI-powered" but has no AI. This is a significant gap between marketing and reality.

2. **No AI infrastructure** — Even if AI endpoints were added, there's no infrastructure for:
   - API key management for AI providers
   - Cost tracking and budget limits
   - Response caching to reduce API calls
   - Fallback between providers (OpenAI → Anthropic → Google)
   - Rate limiting per workspace
   - Content safety filtering

3. **No AI data pipeline** — No pipeline to collect play logs, screen metrics, and user interactions for training or fine-tuning.

---

## 5. Risks

- **Critical: Product differentiation** — Without AI, the product is a standard digital signage tool in a competitive market.
- **Medium: Customer expectations** — If marketing promises AI features, customers will be disappointed.
- **Low: Technical debt** — Adding AI later will require significant architectural changes.

---

## 6. Priority: **Low** (for backend audit) / **High** (for product strategy)

AI is not a backend infrastructure gap — it's a product feature gap. The backend architecture supports adding AI modules without redesign.

---

## 7. Completion Percentage: **15%**

Only prayer times and Ramadan mode exist, which are algorithmic (not AI). Zero AI endpoints, zero LLM integration, zero ML models.

---

## 8. Recommendations

### Phase 1: Foundation
1. Create `domains/ai/` module with `AiService` that abstracts LLM providers
2. Add `@nestjs/axios` for HTTP calls to AI provider APIs
3. Implement provider abstraction: OpenAI, Anthropic, Google Gemini with fallback
4. Add AI cost tracking: `AiUsageLog` model with `workspaceId`, `provider`, `tokensUsed`, `cost`
5. Add per-workspace AI rate limiting and budget caps

### Phase 2: Content Generation
6. `POST /ai/generate-text` — Generate ticker text, announcements, news summaries
7. `POST /ai/generate-image` — Generate images from text descriptions
8. `POST /ai/suggest-template` — Recommend templates based on industry/use case
9. `POST /ai/improve-content` — Rewrite/improve existing text content
10. `POST /ai/translate` — Translate content between languages (EN ↔ AR)

### Phase 3: Smart Scheduling
11. `GET /ai/schedule-suggestions` — Suggest optimal display times for content
12. `POST /ai/optimize-schedule` — Automatically adjust schedule based on performance
13. `GET /ai/audience-insights` — Foot traffic predictions by time/day

### Phase 4: Design Intelligence
14. `POST /ai/suggest-layout` — Suggest canvas element arrangement
15. `POST /ai/smart-crop` — AI-powered image cropping for different orientations
16. `GET /ai/contrast-check` — Accessibility contrast checking for designs

### Phase 5: Analytics & NLP
17. `GET /ai/content-recommendations` — Recommend content based on performance
18. `POST /ai/natural-language-schedule` — "Show this every Monday at 9am" → schedule
19. `POST /ai/chat` — Conversational assistant for signage management
20. `GET /ai/anomaly-detection` — Detect unusual screen behavior

---

## 9. Future Tasks

- [ ] Create AI domain module with provider abstraction
- [ ] Add AI usage tracking model
- [ ] Implement text generation endpoint
- [ ] Implement image generation endpoint
- [ ] Implement template suggestion endpoint
- [ ] Implement content translation endpoint
- [ ] Implement schedule suggestion endpoint
- [ ] Implement smart crop endpoint
- [ ] Implement natural language schedule creation
- [ ] Implement AI chat assistant
- [ ] Add AI cost tracking and budget limits
- [ ] Add AI content safety filtering
