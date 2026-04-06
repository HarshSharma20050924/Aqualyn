# Aqualyn — Production Project CLAUDE.md

## Project Overview
**Aqualyn** is a high-performance messaging/social platform.
- **Backend:** Node.js (Express/Fastify) with Prisma ORM (PostgreSQL).
- **Architecture:** Distributed Microservices (Auth, Chat, Social, Media).
- **Real-time:** Socket.io with Redis Pub/Sub for cross-server scaling.
- **Frontend/Mobile:** React (Web) + Capacitor.js (Native APK/IPA).

## Critical Rules

### 1. Backend & Data (Prisma)
- **Model Integrity:** Never modify `prisma/schema.prisma` without a formal migration.
- **Queries:** All DB queries must handle `BigInt` correctly (common in social IDs).
- **Sharding Ready:** Write chat logic assuming the `messages` table will be sharded by `chat_id`.
- **Redis:** Use Redis for Session persistence and Presence (Who's online).

### 2. High-Concurrency Patterns (100k Users)
- **Fan-out:** Social feeds must use a "push-on-write" strategy for high-profile users.
- **Socket.io:** Never emit to room "all"—always target specific `chat_id` rooms.
- **Stateless:** The API must be 100% stateless (JWTs only) to allow horizontal scaling.

### 3. Mobile (Capacitor.js)
- **Runtime Checks:** Always use `isNativePlatform()` before calling Capacitor plugins.
- **Offline First:** Local state (Zustand/Redux) must persist to `Filesystem` for offline chat reading.

### 4. Code Quality
- **Immutability:** No direct mutation of arrays/objects.
- **Async:** No unhandled promises. All API routes must use a global catch-all error handler.
- **Validation:** Use **Zod** for all Request Body and Environment Variable validation.

## Tech Stack Specifics
```
backend/
  src/
    services/        # Business logic (Auth, Chat, Social)
    routes/          # API endpoints
    middlewares/     # Auth, Rate-limiting, Logging
  prisma/            # Migrations & Schema
src/
  screens/           # React Native / Web views
  components/        # UI + Layout
  hooks/             # Custom Capacitor/React logic
```

## ECC Agent Workflow (Use for ALL LLMs)

1. **Planning:** `/plan "Decompose Chat into a microservice"` -> Uses `planner`.
2. **Architecture:** *"Delegate to the `architect` agent to design the Redis sync."*
3. **TDD:** `/tdd` -> Enforce failing tests first.
4. **Audit:** `/security-scan` -> Check for SQLi and Secret leaks.

## Production Checklist (Phase 1)
- [ ] Redis clusters synced.
- [ ] Capacitor Android build green.
- [ ] Prisma migrations verified on staging.
- [ ] Rate-limiting enabled via Redis throttling.
