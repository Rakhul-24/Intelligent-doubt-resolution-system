# 📊 Project Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT DOUBT RESOLUTION SYSTEM            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌──────────────┐        ┌─────────────────┐
│ Student Portal  │         │   Backend    │        │  Staff Portal   │
│   (React)       │◄───────►│  (Express)   │◄──────►│   (React)       │
│ Port: 3000      │         │ Port: 5000   │        │ Port: 3001      │
└─────────────────┘         └──────────────┘        └─────────────────┘
       │                           │                       │
       │                           │                       │
       │                      ┌────▼─────┐               │
       │                      │ MongoDB   │               │
       │                      │ Database  │               │
       │                      └───────────┘               │
       │                           ▲                       │
       │                           │                       │
       └───────────────────────────┼───────────────────────┘
         (HTTP + WebSocket)        │
                              (Models & Queries)
```

## User Flow Diagram

```
STUDENT JOURNEY                         STAFF JOURNEY
─────────────────────────────────────────────────────────

1. REGISTRATION                         1. REGISTRATION
   ↓                                       ↓
   Email + Password + Role                Email + Password + Subject
   ↓                                       ↓
   
2. LOGIN                                2. LOGIN
   ↓                                       ↓
   JWT Token                              JWT Token
   ↓                                       ↓

3. DASHBOARD                            3. DASHBOARD
   ├─ Book Slots                          ├─ Create Slots
   ├─ Chat                                ├─ View Bookings
   ├─ Materials                           ├─ Chat
   └─ My Bookings                         └─ Upload Materials
       │                                      │
       ├─ Real-time Chat ◄────────────────┤
       │                                      │
       ├─ Download Materials ◄────────────┤
       │                                      │
       └─ Attend Sessions                   └─ Teach Sessions
```

## Feature Matrix

```
┌──────────────────┬─────────────┬────────────┐
│     Feature      │   Student   │   Staff    │
├──────────────────┼─────────────┼────────────┤
│ Register/Login   │      ✅     │     ✅     │
│ View Profile     │      ✅     │     ✅     │
│ Edit Profile     │      ✅     │     ✅     │
│                  │             │            │
│ Book Slots       │      ✅     │     ❌     │
│ Create Slots     │      ❌     │     ✅     │
│ View Slots       │      ✅     │     ✅     │
│ Cancel Booking   │      ✅     │     ❌     │
│ Delete Slots     │      ❌     │     ✅     │
│                  │             │            │
│ Send Message     │      ✅     │     ✅     │
│ Receive Message  │      ✅     │     ✅     │
│ View Chat        │      ✅     │     ✅     │
│ Real-time Chat   │      ✅     │     ✅     │
│                  │             │            │
│ Upload Material  │      ❌     │     ✅     │
│ View Materials   │      ✅     │     ✅     │
│ Download Material│      ✅     │     ✅     │
│ Delete Material  │      ❌     │     ✅     │
└──────────────────┴─────────────┴────────────┘
```

## Component Hierarchy

```
STUDENT PORTAL
───────────────
App
├── PrivateRoute
│   ├── Navbar
│   └── StudentDashboard
├── PrivateRoute
│   ├── Navbar
│   └── SlotBookingPage
├── PrivateRoute
│   ├── Navbar
│   └── ChatPage
├── PrivateRoute
│   ├── Navbar
│   └── MaterialsPage
├── StudentLogin
└── StudentRegister


STAFF PORTAL
────────────
App
├── PrivateRoute
│   ├── Navbar
│   └── StaffDashboard
├── PrivateRoute
│   ├── Navbar
│   └── SlotManagementPage
├── PrivateRoute
│   ├── Navbar
│   └── ChatPage
├── PrivateRoute
│   ├── Navbar
│   └── MaterialsUploadPage
├── StaffLogin
└── StaffRegister
```

## Data Flow Diagram

```
USER ACTION → COMPONENT → API CALL → BACKEND → DATABASE
                │                        │          │
                └────────────────────────┼──────────┘
                   (JSON Response)       │
                                    PROCESS
                                         │
                                  SAVE/RETRIEVE
                                         │
                ┌────────────────────────┘
                │
            RESPONSE ← API Controller ← Model Query
                │
            RE-RENDER
                │
         UI UPDATE
```

## API Request Flow

```
CLIENT                                SERVER
────────────────────────────────────────────────

1. Send Request
   ├─ Method: POST/GET/PUT/DELETE
   ├─ URL: /api/endpoint
   ├─ Headers: Authorization: Bearer <token>
   └─ Body: JSON data
                        │
                        ▼
                   Receive Request
                        │
                        ▼
                   Parse Request
                        │
                        ▼
                   Check Auth Token
                        │
                        ├─ Valid ──────► Check Role
                        │                   │
                        │                   ├─ Staff ─► Access
                        │                   └─ Student ─► Access
                        │
                        └─ Invalid ────► Return 401
                        │
                        ▼
                   Controller Logic
                        │
                        ▼
                   Database Query
                        │
                        ▼
                   Process Data
                        │
                        ▼
                   Return Response
                        │
                        ▼
   Receive Response
   ├─ Status Code
   ├─ Body: JSON
   └─ Handle Error/Success
                        │
                        ▼
                   Update State
                        │
                        ▼
                   Re-render UI
```

## Real-time Chat Flow

```
STUDENT                    SOCKET.IO                    STAFF
──────────────────────────────────────────────────────────────

User A sends               Client 1 emits              
message                    'send_message'
  │                             │
  ▼                             ▼
"Hello!"  ─────────────►  Server receives
                              │
                              ▼
                         Save to MongoDB
                              │
                              ▼
                         Emit to Client 2
                         'receive_message'
                              │
                              ◄─────────────  Message received
                                            by User B
                         
User B replies ──────────►  Server processes
"Hi there!"                  │
                              ▼
                         Save to MongoDB
                              │
                              ▼
                         Emit to Client 1
                         'receive_message'
                              │
                              ◄─────────────  Reply received
                                            by User A
```

## Authentication Flow

```
1. REGISTRATION
   ┌─────────────────────────────────┐
   │ User fills registration form    │
   │ - Name, Email, Password, Role   │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Client sends to /api/auth/register
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Server validates input           │
   │ - Check duplicate email         │
   │ - Validate password             │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Hash password with Bcrypt        │
   │ Create user in MongoDB          │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Generate JWT token               │
   │ Return token + user data        │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Client stores in localStorage    │
   │ - token                         │
   │ - user                          │
   │ - role                          │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Redirect to Dashboard            │
   └─────────────────────────────────┘

2. LOGIN
   ┌─────────────────────────────────┐
   │ User enters email + password    │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Client sends to /api/auth/login  │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ Find user by email + role       │
   │ Compare password with hash      │
   └──────────────┬──────────────────┘
                  │
                  ├─ Match ─────────────► Generate JWT
                  │                            │
                  │                            ▼
                  │                      Return token
                  │                            │
                  │                            ▼
                  │                      Store locally
                  │                            │
                  │                            ▼
                  │                      Redirect
                  │
                  └─ No Match ─────────► Return 401

3. PROTECTED ROUTE ACCESS
   ┌─────────────────────────────────┐
   │ User accesses protected page    │
   └──────────────┬──────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────┐
   │ PrivateRoute checks token       │
   │ - Get from localStorage         │
   │ - Verify exists                 │
   └──────────────┬──────────────────┘
                  │
                  ├─ Token exists ────────► Allow access
                  │                              │
                  │                              ▼
                  │                         Load page
                  │
                  └─ No token ────────────► Redirect
                                           to login
```

## Technology Stack Details

```
FRONTEND STACK
──────────────
React 18.2.0
  ├─ React Router DOM 6.8.0 (Routing)
  ├─ Axios 1.3.0 (HTTP Client)
  ├─ Socket.io-client 4.5.4 (WebSocket)
  ├─ Bootstrap 5.2.3 (Styling)
  └─ Context API (State Management)


BACKEND STACK
─────────────
Node.js + Express 4.18.2
  ├─ Mongoose 7.0.0 (MongoDB ODM)
  ├─ JWT-Simple 0.5.6 (Token Generation)
  ├─ Bcryptjs 2.4.3 (Password Hashing)
  ├─ CORS 2.8.5 (Cross-Origin)
  ├─ Socket.io 4.5.4 (Real-time)
  └─ Dotenv 16.0.3 (Env Variables)


DATABASE
────────
MongoDB 5.0+
  ├─ Collections
  │  ├─ users
  │  ├─ slots
  │  ├─ chats
  │  └─ materials
  └─ Indexes on frequently queried fields
```

## State Management

```
CONTEXT API STRUCTURE
─────────────────────

AuthContext
├─ user (Object)
│  ├─ _id
│  ├─ name
│  ├─ email
│  ├─ role
│  └─ subject (for staff)
├─ token (String)
├─ loading (Boolean)
├─ isAuthenticated (Boolean)
├─ register (Function)
├─ login (Function)
├─ logout (Function)
└─ updateProfile (Function)

LocalStorage
├─ token
├─ user (JSON string)
└─ role
```

## Performance Optimizations

```
Frontend
────────
✅ React.memo for components
✅ useContext for state (no prop drilling)
✅ useCallback for stable functions
✅ Lazy loading with code splitting
✅ Bootstrap for minimal CSS
✅ Axios request caching

Backend
───────
✅ JWT tokens for stateless auth
✅ Bcrypt with 10 salt rounds
✅ MongoDB indexes on key fields
✅ Socket.io connection pooling
✅ Error handling middleware
✅ Request validation
```

---

## 📈 Scalability Considerations

For production deployment:

1. **Database**
   - Enable MongoDB Atlas auto-scaling
   - Create indexes on frequently queried fields
   - Implement connection pooling

2. **Backend**
   - Use load balancer (Nginx/HAProxy)
   - Deploy multiple instances
   - Use Redis for caching
   - Implement rate limiting

3. **Frontend**
   - Build and minify
   - Use CDN for static files
   - Implement lazy loading
   - Service workers for offline support

4. **Security**
   - Use HTTPS
   - Implement refresh tokens
   - Rate limiting on endpoints
   - Input validation & sanitization
   - CORS properly configured

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Status**: Production Ready ✅
