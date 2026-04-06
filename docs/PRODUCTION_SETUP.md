# Aqualyn Production Setup & System Architecture Documentation

## 1. Executive Summary
Aqualyn is a high-performance, real-time social and messaging platform designed to scale from 10k to 100k+ concurrent users. This document outlines the senior-level engineering strategy for deploying a production-ready environment, focusing on high availability, low latency, and seamless mobile integration.

---

## 2. Tech Stack Overview
### Frontend
- **Framework:** React 18+ with TypeScript.
- **State Management:** Context API (current) transitioning to Redux Toolkit or Zustand for complex state.
- **Animations:** Framer Motion (motion/react).
- **Styling:** Tailwind CSS.
- **Mobile Bridge:** **Capacitor.js** (Recommended for converting this web app into a high-performance native APK/IPA).

### Backend (Production Target)
- **Runtime:** Node.js (Express/Fastify) or Go (for high-concurrency services).
- **Real-time:** Socket.io or WebSockets (AWS AppSync/Pusher for managed scaling).
- **API Style:** REST for standard CRUD, GraphQL for complex social feeds.

### Infrastructure & DevOps
- **Cloud Provider:** AWS (Amazon Web Services) or GCP (Google Cloud Platform).
- **Containerization:** Docker + Kubernetes (EKS/GKE).
- **CI/CD:** GitHub Actions or GitLab CI.
- **CDN:** CloudFront or Cloudflare for global asset delivery.

---

## 3. System Architecture (High-Level)

### 3.1. Load Balancing & Gateway
- **Nginx/AWS ALB:** Entry point for all traffic, handling SSL termination and request routing.
- **API Gateway:** Handles authentication, rate limiting, and request transformation.

### 3.2. Microservices Breakdown
To handle 100k users, we decouple the monolith into specialized services:
1. **Auth Service:** Handles JWT issuance, OAuth (Google/Apple), and session management.
2. **Chat Service:** Manages real-time socket connections and message persistence.
3. **Social Service:** Handles posts, stories, follows, and feed generation.
4. **Media Service:** Processes image/video uploads (resizing, transcoding) via AWS Lambda.
5. **Notification Service:** Manages Push Notifications (FCM/APNs) and in-app alerts.

### 3.3. Data Layer Strategy
- **Primary Database:** **PostgreSQL** (Managed via RDS/Cloud SQL). Use Read Replicas to scale read-heavy social feeds.
- **Caching Layer:** **Redis**. Used for session storage, real-time presence (who's online), and caching hot posts/stories.
- **Search Engine:** **Elasticsearch** or **Algolia** for high-speed username/phone number search.
- **Object Storage:** **AWS S3** for storing user-generated images and videos.

---

## 4. Scalability Strategy (10k to 100k Users)

### 4.1. Horizontal Scaling
- **Auto-scaling Groups:** Automatically spin up/down EC2 instances or K8s pods based on CPU/Memory usage.
- **Database Sharding:** As we approach 100k users, consider sharding the `messages` table by `chat_id` to prevent single-instance bottlenecks.

### 4.2. Real-time Scaling
- **Redis Pub/Sub:** Essential for syncing Socket.io events across multiple backend instances. If User A is on Server 1 and User B is on Server 2, Redis ensures the message reaches both.

### 4.3. Feed Optimization
- **Fan-out Strategy:** When a "Celebrity" user (many followers) posts, use a background worker (BullMQ/RabbitMQ) to push the post ID into the "Home Feed" cache of all active followers.

---

## 5. Mobile Deployment (APK Strategy)

To transform the current Aqualyn web app into a Play Store-ready APK:

### 5.1. Using Capacitor.js
1. **Initialize:** `npm install @capacitor/core @capacitor/cli`
2. **Add Android:** `npx cap add android`
3. **Build Web:** `npm run build`
4. **Sync:** `npx cap copy`
5. **Native Features:** Use Capacitor plugins for:
   - **Push Notifications:** `@capacitor/push-notifications`
   - **Camera:** `@capacitor/camera`
   - **Filesystem:** `@capacitor/filesystem` (for saving posts/media).

### 5.2. Play Store Requirements
- **App Bundle (AAB):** Generate an AAB file via Android Studio for optimized delivery.
- **Privacy Policy:** Required for social apps handling user data.
- **Content Rating:** social apps usually require a "12+" or "Teen" rating due to user-generated content.

---

## 6. Security & Compliance
- **End-to-End Encryption (E2EE):** Implement Signal Protocol (libsignal) for Secret Chats.
- **Data at Rest:** All S3 buckets and RDS instances must use AES-256 encryption.
- **Rate Limiting:** Protect APIs from DDoS using Cloudflare WAF and Redis-based throttling.

---

## 7. Implementation Roadmap
1. **Phase 1 (Infrastructure):** Set up VPC, RDS, and EKS clusters.
2. **Phase 2 (Migration):** Move local state logic to API-driven services.
3. **Phase 3 (Mobile):** Integrate Capacitor and test on physical Android devices.
4. **Phase 4 (Load Testing):** Use **Locust** or **JMeter** to simulate 50k concurrent users and identify bottlenecks.
5. **Phase 5 (Launch):** Deploy to Play Store and Landing Page.

---

## 8. Landing Page & APK Distribution

### 8.1. Landing Page Architecture
- **Framework:** Next.js (Static Site Generation) or Astro for SEO-optimized delivery.
- **Hosting:** Vercel or Netlify for fast global edge delivery.
- **Features:**
  - **Download Button:** Direct link to the `.apk` file hosted on S3/CloudFront.
  - **QR Code:** For quick mobile scanning and installation.
  - **Feature Showcase:** High-quality screenshots and videos of Aqualyn.

### 8.2. APK Build Process (Fast-Track)
1. **Build Web App:** `npm run build`
2. **Sync to Capacitor:** `npx cap sync android`
3. **Open Android Studio:** `npx cap open android`
4. **Build Signed APK:** 
   - Go to `Build > Generate Signed Bundle / APK`.
   - Select `APK`.
   - Create a new KeyStore (keep this safe!).
   - Build `release` variant.
5. **Upload:** Place the resulting `app-release.apk` on your landing page's `/download` path.

---

**Prepared by:** Senior Systems Architect
**Date:** April 1, 2026
**Project:** Aqualyn Social Messenger
