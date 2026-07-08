# Blueprints: The Ultimate Offline System Design Guide

An interactive, premium, and fully self-contained offline application for mastering system design. This repository hosts a customized Single-Page Application (SPA) compiled directly from Donne Martin's famous `system-design-primer`, enhanced with modern web design, offline assets, natively ingested external engineering blogs, and advanced modules.

## 🚀 Live Demo
This guide is deployed and accessible online via GitHub Pages:
👉 **[https://waleed-tahir.github.io/sysdesigtutorial-/](https://waleed-tahir.github.io/sysdesigtutorial-/)**

---

## ✨ Features

### 1. 📱 Premium Interactive SPA
- Modern dark mode UI with polished typography, HSL-tailored colors, and smooth transitions.
- Interactive navigation sidebar for seamless browsing.
- Session-based progress tracking and interactive knowledge check quizzes for key modules.

### 2. 📖 Fully Restored Foundational Curriculum
- Restored full technical detail, advantages, disadvantages, and nuances for all 23 original foundational modules (DNS, Load Balancing, CDN, Relational vs NoSQL Databases, Cache strategies, etc.).

### 3. 🖼️ Self-Contained Offline Diagrams
- 40+ system architecture and process flow diagrams are downloaded and stored locally in the `images/` directory. The app functions completely offline without fetching external assets.

### 4. 📚 In-App External Knowledge Base (76+ Resources)
- External engineering blogs, Wikipedia articles, and whitepapers (from AWS, Percona, etc.) have been scraped, parsed (removing ads, sidebars, and trackers), and formatted to fit the application's clean design.
- Clicking external references loads them **natively within the app** (no internet connection required).
- Built-in **navigation history stack** with a `← Back to Lesson` button so you can explore external knowledge and jump right back to where you left off.

### 5. 🧠 Beyond-the-Primer Advanced Modules
Includes custom deep-dives into modern, production-grade system architectures:
- **Vector Databases** (Dense embeddings, ANN search)
- **Service Mesh & Sidecars** (mTLS, service discovery)
- **Saga Pattern** (Choreography vs. Orchestration for distributed transactions)
- **Distributed Consensus** (Paxos, Raft, Quorum mechanisms)
- **CRDTs** (Conflict-free Replicated Data Types for collaborative/lockless systems)

---

## 🛠️ File Structure
```
├── index.html         # Main SPA codebase (HTML, CSS, JS Router, Lesson Payloads)
├── images/            # Locally stored architectural diagrams
├── offline_links/     # Scraped raw HTML files of external resources
└── scripts/           # Python & Node automation/compilation scripts used during build
```

---

## 💻 Running Locally
Since the entire application is client-side, you can run it locally without any server.
Simply double-click the `index.html` file or run a simple local server:
```bash
# Python 3
python -m http.server 8000
```
Open your browser to `http://localhost:8000`.
