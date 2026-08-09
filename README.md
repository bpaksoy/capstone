<div align="center">
  <img src="https://wormie.app/wormie-logo.svg" alt="Worm Logo" width="100"/>
  <h1>Worm</h1>
  <p><strong>Find your perfect college match with AI-driven insights and real student community.</strong></p>
  <p><a href="https://wormie.app" target="_blank"><strong>🚀 Live Application</strong></a></p>
</div>

---

## 🚀 What the App Does

**Worm** is a comprehensive, AI-powered higher education discovery platform designed to help prospective students and institutional representatives navigate the college admissions process. 

Instead of dealing with fragmented data across dozens of university websites, Worm aggregates official IPEDS (College Board) data into a single, beautifully designed dashboard. Users can discover colleges, apply advanced filters, bookmark their favorites, and interact dynamically with **Wormie**, a personalized AI Admissions Assistant running on Google's Gemini model.

It also features a built-in social network where students can join "College Hubs," ask questions, direct message peers, and even connect with verified admission officers.

---

## ✨ Features

- **🤖 Wormie AI Assistant:** A globally aware AI agent trained on your specific bookmarks and major preferences to give personalized admissions advice, calculate your chances, and even draft outreach emails to recruiters.
- **🔍 Advanced Data Discovery:** Search over 7,000 U.S. colleges with precise filters for tuition cost, SAT scores, acceptance rates, and institution type.
- **📊 Real Institutional Data:** Clean, easily readable data visualizations covering graduation rates, diversity, and maps.
- **bookmark Bookmarks & Smart Matches:** Save your favorite schools and let our recommendation engine find similar hidden gems based on your statistical profile.
- **💼 Proactive Recruiter Outreach:** A specialized feature set that allows verified college admissions staff to discover prospective students actively researching their institutions, enabling them to initiate highly-targeted, personalized direct messaging campaigns.
- **💬 Social Hubs & DMs:** Every college has a dedicated community hub for students to post questions, comment, and connect via direct messaging.

---

## 📸 Application Showcase

![Worm Dashboard Preview](./screenshot.png)

---

## 💻 Tech Stack

### Frontend
- **Framework:** React.js
- **Styling:** Vanilla CSS & TailwindCSS (for utility processing)
- **Deployment:** Firebase Hosting
- **Authentication:** Clerk Auth
- **Icons & UI:** Heroicons

### Backend
- **Framework:** Django & Django REST Framework (Python)
- **Database:** PostgreSQL
- **Deployment:** Google Cloud Run & Cloud SQL
- **AI Integration:** Google Gemini API (Semantic Vector Search & Chat)

---

## 🏗️ Component & Agentic Architecture

Worm integrates a modular client-server architecture with semantic database indices and real-time LLM-driven actions to create a unified discovery platform.

### System Components

```mermaid
graph TD
    subgraph Client [React Frontend - Firebase Hosting]
        App[App.js / React Router]
        UserProv[UserProvider - Clerk Auth]
        AIAgent[AIAgent.js - Wormie Floating UI]
        Portal[CollegePortal.js - Recruitment Workspace]
    end

    subgraph Service [Django Backend - Google Cloud Run]
        DRF[Django REST Framework]
        Views[views.py - Controller Logic]
        Serializers[serializers.py - Data Validation]
    end

    subgraph Storage [Database & Search Engine]
        DB[(PostgreSQL / SQLite)]
        FAISS[langchain FAISS - Vector Index]
    end

    subgraph AI [Generative AI]
        Gemini[Google Gemini API]
    end

    App -->|APIs| DRF
    UserProv -->|Auth Sync| DRF
    AIAgent -->|Streaming Chat API| DRF
    DRF --> Views
    Views --> Serializers
    Views -->|Query / Write| DB
    Views -->|Vector Similarity Search| FAISS
    Views -->|Generate Content / Embeddings| Gemini
```

---

### Wormie AI & RAG Engine

Wormie utilizes a hybrid RAG (Retrieval-Augmented Generation) pipeline. It combines semantic vector queries on an IPEDS description index with keyword acronym matching (e.g. mapping "MIT" or "UCLA") to construct highly relevant contextual prompts:

```mermaid
sequenceDiagram
    participant User as React Frontend
    participant ChatView as AIChatView
    participant FAISS as FAISS Index
    participant DB as Django DB
    participant Gemini as Gemini Model (gemini-flash-latest)

    User->>ChatView: POST /api/ai/chat/ (message + context)
    opt Similarity Search
        ChatView->>FAISS: Search keywords / query description
        FAISS-->>ChatView: Return top 3 matching college documents
    end
    opt Acronym & Exact String Matching
        ChatView->>DB: Query Q(name__icontains=term)
        DB-->>ChatView: Return matched college metadata
    end
    opt Profile Memory Enrichment
        ChatView->>DB: Retrieve User info (Bookmarks, GPA, SAT, Major, Role)
        DB-->>ChatView: Return user attributes & stats
    end
    ChatView->>ChatView: Synthesize System Prompt with context & instructions
    ChatView->>Gemini: generate_content(stream=True)
    loop Stream Responses
        Gemini-->>ChatView: Yield chunk.text
        ChatView-->>User: Streaming event stream (text/plain)
    end
    ChatView->>DB: Save full AI response to ChatMessage history
```

---

### Gemini 2.0 Managed Agent & Recruitment CRM

Wormie is powered by a **Gemini 2.0 Managed Agent architecture** using the official `google-genai` SDK. Instead of relying on passive text completion, Wormie utilizes **Native Function Calling** to autonomously execute multi-step database operations.

We defined strongly-typed Python tool functions (`get_college_details`, `search_colleges`, `calculate_admission_chances`, `bookmark_college`, `submit_lead`) that Gemini actively inspects and invokes. When a user chats with Wormie, the agent evaluates their intent and executes backend tools on their behalf—such as saving a bookmark or routing a verified candidate profile into a university's CRM pipeline.

```mermaid
sequenceDiagram
    participant User as Student (Chat Panel)
    participant ChatView as AIChatView (Django)
    participant Agent as WormieManagedAgent (Gemini 2.0)
    participant DB as Postgres Database
    participant Recruiter as Recruiter (College Portal)

    User->>ChatView: "Bookmark Boston University and submit my profile lead"
    ChatView->>Agent: stream_chat() with user message
    Agent->>Agent: Analyzes intent & selects tools
    
    critical Autonomous Tool Execution
        Agent->>DB: execute bookmark_college(user, 'Boston University')
        DB-->>Agent: Returns ToolResult (Success)
        Agent->>DB: execute submit_lead(user, 'Boston University')
        DB-->>Agent: Returns ToolResult (Created Lead)
    end
    
    Agent-->>ChatView: Yields synthesized natural language response stream
    ChatView-->>User: Streaming chat output (SSE)
    DB->>Recruiter: New Candidate Lead Appears in Portal
```

1. **Bookmark College**: Adds institutions to the student's personal bookmarks list via tool execution.
2. **Submit Recruitment Lead**: Submits student credentials to recruiters, placing the student directly into the university's recruitment CRM funnel inside the **College Portal**.

---

### Monetization & Operations Telemetry

To ensure business viability, Worm incorporates a dynamic advertisement campaign engine for sponsored university spotlights:
* **Real-time Telemetry Tracking**: Logs impressions on feed renders and tracks click-through events on CTA redirects.
* **Flexible Pricing Models**: Admins can configure campaigns using three models:
  * **Flat Rate**: Charged as a flat fee (e.g. $150.00).
  * **Cost Per Click (CPC)**: Dynamic revenue computed as `clicks * price`.
  * **Cost Per Mille (CPM)**: Dynamic revenue computed as `(impressions / 1000) * price`.
* **Integrated Finance Dashboard**: Aggregates sponsored ad revenues with transactional marketplace sales into unified monthly analytics charts.

---

## 🛠️ How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/bpaksoy/capstone.git
cd capstone
```

### 2. Backend Setup
You will need API keys for Google Gemini and Clerk Authentication.
```bash
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your keys
echo "CLERK_SECRET_KEY=your_key_here" > .env
echo "GEMINI_API_KEY=your_key_here" >> .env

# Run migrations & start server
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```
*The backend API will run on `http://127.0.0.1:8000`.*

### 3. Frontend Setup
```bash
cd ../frontend

# Install node modules
npm install

# Start the React app
npm start
```
*The application UI will run on `http://localhost:3000`.*

---

## 🎯 Who is this for?

- **High School Students:** Navigating the stressful college application process and looking for data-driven answers and community support.
- **Guidance Counselors:** Tracking student preferences and discovering accessible, high-ROI institutions.
- **College Admissions Staff:** Finding prospective students who match their institution's statistical profile and initiating outreach.

---

## 🗺️ Roadmap / Planned Features

- [ ] **Application Tracker:** A kanban-style board to track submission deadlines, essays, and application statuses.
- [ ] **Mobile Application:** Porting the Responsive UI into a standalone React Native app.
- [ ] **Virtual Tours Integration:** Incorporating 360-degree video embeds for remote campus visits.
- [ ] **Alumni Verification:** A badge system to identify verified graduates providing advice in College Hubs.