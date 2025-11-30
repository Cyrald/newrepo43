# Overview

This is a full-stack e-commerce platform for natural and organic products (EcoMarket). The application is built with a React frontend using TypeScript and Vite, and an Express backend with PostgreSQL database (via Neon serverless) managed through Drizzle ORM. The platform supports product catalog management, shopping cart, wishlists, order processing, payment integration (YooKassa), promotional codes, bonus system, and customer support chat with real-time WebSocket communication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as build tool and dev server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Zustand for client-side state management (auth, cart, chat)
- Shadcn UI components with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Form handling via React Hook Form with Zod validation

**State Management Pattern:**
- Server state cached and synchronized via TanStack Query
- Client-only state (auth, cart, chat UI) managed in Zustand stores
- Optimistic updates for cart operations with automatic rollback on failure
- Real-time WebSocket updates for support chat and order notifications

**Component Structure:**
- Page components lazy-loaded for code splitting
- Reusable UI components from Shadcn library
- Protected routes with role-based access control
- Admin layout with collapsible sidebar for staff interface
- Error boundaries for graceful error handling

## Backend Architecture

**Core Technologies:**
- Node.js with Express framework
- TypeScript with ESM modules
- Drizzle ORM for type-safe database operations
- PostgreSQL via @neondatabase/serverless
- WebSocket (ws) for real-time communication

**Authentication & Security:**
- Session-based authentication using express-session with PostgreSQL storage (connect-pg-simple)
- bcrypt for password hashing with timing-attack protection
- CSRF protection via csrf-csrf library (double-submit cookie pattern)
- Role-based access control (admin, marketer, consultant, customer)
- Rate limiting on sensitive endpoints (express-rate-limit)
- Helmet for security headers
- Input sanitization and validation via Zod schemas
- Path traversal protection for file operations
- Idempotency keys for critical operations (order creation)

**Image Processing Pipeline:**
- Sharp for image optimization and resizing
- Custom ImagePipeline class handling upload, processing, and cleanup
- Multer for multipart form-data handling
- Automatic format conversion to WebP
- Temporary file cleanup with scheduled garbage collection
- Path security validation to prevent directory traversal

**Business Logic Modules:**
- Bonus/cashback calculation system (3-10% based on order amount)
- Promocode validation with single-use and temporary types
- Order processing with race condition protection via database transactions
- Email verification system using Nodemailer
- Data retention scheduler for GDPR compliance (37-month retention)

**API Design:**
- RESTful endpoints organized by resource type
- Consistent error handling with custom AppError classes
- Request logging with unique request IDs (nanoid)
- Resource ownership validation middleware
- Content-Type validation for JSON/multipart endpoints

**WebSocket Architecture:**
- Persistent connections for support chat
- Cookie-based session authentication for WebSocket handshake
- Connection rate limiting (10 connections per minute)
- Message rate limiting (60 messages per minute)
- Automatic reconnection handling on client side
- Real-time order status updates pushed to admin users

**Database Schema Design:**
- User management with email verification
- Role-based permissions via join table
- Product catalog with categories and multi-image support
- Shopping cart with product relationships
- Order system with itemized details stored as JSONB
- Promocode usage tracking
- Support conversation threading
- Session storage via connect-pg-simple
- Idempotency keys table for duplicate request prevention

## External Dependencies

**Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- Connection pooling configured (max 20 connections)
- Managed via Drizzle ORM with migration support

**Email Service:**
- Nodemailer for transactional emails
- SMTP configuration via environment variables
- Email verification and order confirmations

**Payment Integration:**
- YooKassa (Russian payment gateway)
- Webhook signature verification using HMAC-SHA256
- Timing-safe comparison to prevent timing attacks

**External APIs (Optional/Configured):**
- CDEK delivery service integration (credentials in env)
- Boxberry pickup points (API token in env)

**Development Tools:**
- Replit-specific plugins for Vite (cartographer, dev-banner, runtime error overlay)
- Drizzle Kit for database migrations and schema management
- Winston for structured logging
- TypeScript for type safety across frontend and backend

**Session Storage:**
- PostgreSQL-backed sessions via connect-pg-simple
- 30-day session lifetime
- Secure cookies in production (httpOnly, sameSite: strict)

**File Storage:**
- Local filesystem for product and chat images
- Uploads directory with .temp subdirectory for processing
- Automatic cleanup of orphaned temporary files (30-minute TTL)

**Rate Limiting & Security:**
- express-rate-limit for API endpoints
- Different limits for auth (15/15min), registration (5/hour), uploads (30/hour)
- Search endpoint limited to 60 requests/minute
- CORS configured for production with whitelist validation