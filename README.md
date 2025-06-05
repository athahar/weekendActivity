# 🧭 Smart Family Activity Planner — Multi-Agent LLM System

## 📌 Project Summary

Families often want to spend quality time together — whether that’s a relaxing weekend nearby, an outdoor half-day adventure, or exploring something new in their city. But in practice, most ideas are buried across WhatsApp chats, Instagram reels, forwarded blog posts, or mental “we should do this someday” lists. Add weather, time constraints, and kids’ interests — and the friction becomes too high to act.

### The Vision

This project is building a **multi-agent LLM assistant** that understands your family’s context, recalls your saved activity ideas, checks weather and time constraints, and suggests the most relevant, exciting, and doable plans — whether for 2 hours or a full weekend.

This goes beyond what ChatGPT or other standalone LLM tools can do today because:

- ❌ ChatGPT has **no persistent memory** of your saved ideas or past interests.
- ❌ General-purpose assistants don’t know **your kids, your weekend constraints, or your local context**.
- ❌ Even with plugins or APIs, they cannot **tie together RAG, user profile, time availability, and dynamic planning** into one seamless UX.

This project **solves that** with:
- Multi-agent orchestration
- Real user profiles and family metadata
- Supabase as the backend for persistent notes, preferences, and planning context
- Pinecone-based RAG scoped per user
- LLM-generated final recommendations
- Expandable, fast frontend

---

## 🛠 Current Functionality (MVP v1)

### ✨ Features

- Input: city + user preferences (music, outdoors, etc.)
- Real-time weather + time-of-day analysis
- Event suggestions (static, demo-based)
- LLM-generated recommendation
- Simple mobile-friendly UI (vanilla HTML/CSS/JS)
- Memory log shown in UI for debugging/explainability

### ✅ Current Agents

| Agent | Role | Notes |
|-------|------|-------|
| `weatherAgent` | Summarizes real-time weather for planning | Uses OpenWeather API |
| `eventAgent` | Suggests events based on city & preferences | Currently mocked |
| `activityAgent` | Orchestrates all agents + calls LLM | Handles memory, retry logic |
| `timeUtil.js` | Utility to check daytime vs nighttime | Used by activityAgent |
| `frontend UI` | HTML/CSS/JS app with structured result display | Fully mobile-friendly |

---

## 🔮 Phase 2: What We’re Building Next

To move from MVP to a **truly personalized, multi-user, memory-aware planning assistant**, we need these agents and tables:

---

### 1. 🧠 `savedNoteRAGAgent`

- **Purpose:** Recall the user's saved activity ideas from Supabase and Pinecone
- **Data Source:** User-submitted notes (blog links, videos, messages)
- **RAG filter:** Scoped by `user_id`, optionally by tags or date
- **Supabase Table:** `saved_notes` (with `content`, `tags`, `source`, `user_id`, `created_at`)
- **LLM Use:** Blended into final recommendations

---

### 2. 👨‍👩‍👧‍👦 `profileAgent`

- **Purpose:** Fetch the user profile and their family members
- **Data Source:** Supabase (`users`, `family_members`, `interests`)
- **Fields:** Name, email, preferences, availability
- **Family Members:** Each has name, age, interests

---

### 3. 📅 `availabilityAgent`

- **Purpose:** Normalize user input like "4 hours" or "1 weekend"
- **Output:** Time block (e.g. "Saturday 10am–4pm", "Sunday only")
- **Use:** Filters activity suggestions for realism

---

### 4. 🧭 `tripPlannerAgent`

- **Purpose:** Suggests weekend trips to nearby places
- **Logic:** Checks weather in nearby cities + saved notes + LLM suggestions
- **Use:** Offers 2–3 plan options for longer time availability
- **Future:** Can integrate with Google Places, Eventbrite, Yelp, etc.

---

### 5. 🧰 `orchestratorAgent` (replaces `activityAgent`)

- **Purpose:** Full planner coordinator
- **Calls:** all other agents in sequence or parallel
- **Output:** Final structured plan, timeline, backup options

---

## 🧠 Future Agent Ideas

| Agent | Role |
|-------|------|
| `eventApiAgent` | Connects to Google Events / Eventbrite for live data |
| `recommendationFeedbackAgent` | Learns from user "like/save/skip" signals |
| `linkIngestionAgent` | Let users email or forward links directly into their note inbox |
| `calendarSyncAgent` | Sync planned activities with user’s calendar |
| `mapAgent` | Generates maps or geolocation filters for suggestions |

---

## 🗂 Architecture Summary

User Input
↓
Frontend UI
↓
/recommend (Express backend)
↓
[ OrchestratorAgent ]
├── profileAgent
├── availabilityAgent
├── savedNoteRAGAgent
├── weatherAgent
├── eventAgent
└── tripPlannerAgent (if time > 1 day)
↓
LLM Recommendation
↓
Frontend Render (with memory & breakdown)

## 🔍 Example Use Case

- User has a profile with kids (ages 6 & 10), and interests in food + hiking
- They forward 5 blog links and 2 YouTube videos on “Top things to do near SF”
- On a Friday, they open the app and say:
  > “We have 1 day free on Saturday. What can we do nearby that everyone would enjoy?”

System:
- Pulls the weather forecast
- Checks saved notes + LLM suggestions
- Filters for 1-day plans with child-friendly activities
- Recommends: a local hiking trail + lunch stop + kid-friendly museum
- Reminds: “You saved this 3 months ago: ‘Bay Area redwoods + tacos loop!’ Want to go?”

---

## 🚧 What’s Next

1. [ ] Set up Supabase tables: `users`, `family_members`, `saved_notes`
2. [ ] Build `profileAgent` to fetch structured user + family info
3. [ ] Build `savedNoteRAGAgent` with Pinecone + scoped filtering
4. [ ] Extend frontend for profile management + note entry
5. [ ] Implement planning across durations: 2 hrs, day, weekend

---

## 🧑‍💻 Contributor Notes

- Stack: Node.js (Express), Supabase, Pinecone, OpenAI, HTML/CSS/JS
- Fully serverless-compatible
- Designed for multi-agent clarity and testability
- All agent calls are logged for transparency and debugging

---

**Let’s build the copilot that turns “we should do something fun” into “we had the best day together.”**