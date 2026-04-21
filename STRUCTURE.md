# 📂 Complete Project Structure

## Full Directory Tree

```
Student Doubt Resolution/
│
├── README.md                          # Main documentation
├── QUICK_START.md                     # Quick setup guide
├── PROJECT_OVERVIEW.md                # System architecture
├── API_DOCUMENTATION.md               # API reference
│
├── server/                            # BACKEND
│   ├── controllers/
│   │   ├── authController.js         # User registration, login, profile
│   │   ├── slotController.js         # Slot management (CRUD)
│   │   ├── chatController.js         # Chat message handling
│   │   └── materialController.js     # Material upload, management
│   │
│   ├── models/
│   │   ├── User.js                   # User schema (Student/Staff)
│   │   ├── Slot.js                   # Slot booking schema
│   │   ├── Chat.js                   # Chat message schema
│   │   └── Material.js               # Study material schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js             # Auth endpoints
│   │   ├── slotRoutes.js             # Slot endpoints
│   │   ├── chatRoutes.js             # Chat endpoints
│   │   └── materialRoutes.js         # Material endpoints
│   │
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT verification, role checks
│   │
│   ├── socket.js                     # Socket.io event handlers
│   ├── server.js                     # Express app setup
│   ├── .env                          # Environment variables
│   ├── package.json                  # Dependencies
│   └── .gitignore
│
├── student-client/                   # STUDENT PORTAL (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js             # Navigation bar
│   │   │   └── PrivateRoute.js       # Protected route wrapper
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js        # Auth state management
│   │   │
│   │   ├── pages/
│   │   │   ├── StudentLogin.js       # Login page
│   │   │   ├── StudentRegister.js    # Registration page
│   │   │   ├── StudentDashboard.js   # Dashboard home
│   │   │   ├── SlotBookingPage.js    # Slot booking interface
│   │   │   ├── ChatPage.js           # Real-time chat
│   │   │   └── MaterialsPage.js      # Study materials viewer
│   │   │
│   │   ├── services/
│   │   │   └── api.js                # API calls (Axios)
│   │   │
│   │   ├── App.js                    # Main app component
│   │   └── index.js                  # React DOM render
│   │
│   ├── public/
│   │   └── index.html                # HTML entry point
│   │
│   ├── package.json
│   ├── .gitignore
│   └── README.md
│
└── staff-client/                     # STAFF PORTAL (React)
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js             # Navigation bar
    │   │   └── PrivateRoute.js       # Protected route wrapper
    │   │
    │   ├── context/
    │   │   └── AuthContext.js        # Auth state management
    │   │
    │   ├── pages/
    │   │   ├── StaffLogin.js         # Login page
    │   │   ├── StaffRegister.js      # Registration page
    │   │   ├── StaffDashboard.js     # Dashboard home
    │   │   ├── SlotManagementPage.js # Slot creation/management
    │   │   ├── ChatPage.js           # Chat with students
    │   │   └── MaterialsUploadPage.js # Material upload/management
    │   │
    │   ├── services/
    │   │   └── api.js                # API calls (Axios)
    │   │
    │   ├── App.js                    # Main app component
    │   └── index.js                  # React DOM render
    │
    ├── public/
    │   └── index.html                # HTML entry point
    │
    ├── package.json
    ├── .gitignore
    └── README.md
```

## File Descriptions

### Backend Files

#### Controllers
- **authController.js** (278 lines)
  - `register()` - Create new user
  - `login()` - Authenticate user
  - `getProfile()` - Get user details
  - `updateProfile()` - Update user info
  - `getAllStaff()` - List all staff members

- **slotController.js** (212 lines)
  - `createSlot()` - Create availability slot
  - `getStaffSlots()` - Get staff's slots
  - `getAvailableSlots()` - List available slots
  - `getStudentSlots()` - Get student's bookings
  - `bookSlot()` - Book a slot
  - `updateSlot()` - Modify slot details
  - `deleteSlot()` - Remove slot
  - `cancelBooking()` - Cancel booking

- **chatController.js** (89 lines)
  - `sendMessage()` - Save and send message
  - `getChatHistory()` - Retrieve past messages
  - `getChats()` - Get chat participants

- **materialController.js** (119 lines)
  - `uploadMaterial()` - Upload study material
  - `getAllMaterials()` - List all materials
  - `getStaffMaterials()` - Get staff's materials
  - `updateMaterial()` - Update material details
  - `deleteMaterial()` - Delete material

#### Models
- **User.js** (42 lines)
  - Fields: name, email, password, role, subject, phone, bio, avatar
  - Methods: password hashing, password comparison

- **Slot.js** (38 lines)
  - Fields: staffId, studentId, date, time, duration, status, topic, notes

- **Chat.js** (28 lines)
  - Fields: senderId, receiverId, message, timestamp, read

- **Material.js** (39 lines)
  - Fields: staffId, title, description, subject, topic, fileUrl, fileType

#### Routes
- **authRoutes.js** (15 lines) - 5 endpoints
- **slotRoutes.js** (31 lines) - 8 endpoints
- **chatRoutes.js** (15 lines) - 3 endpoints
- **materialRoutes.js** (20 lines) - 5 endpoints

#### Middleware
- **authMiddleware.js** (32 lines)
  - JWT verification
  - Role-based access control

#### Core Files
- **socket.js** (91 lines) - Real-time messaging handlers
- **server.js** (56 lines) - Express app initialization
- **.env** - Environment configuration
- **package.json** - Dependencies & scripts

### Student Portal Files

#### Components
- **Navbar.js** (54 lines) - Navigation, logout
- **PrivateRoute.js** (24 lines) - Route protection

#### Context
- **AuthContext.js** (62 lines) - Auth state & methods

#### Pages
- **StudentLogin.js** (82 lines) - Email + password form
- **StudentRegister.js** (105 lines) - Registration form
- **StudentDashboard.js** (77 lines) - Home dashboard
- **SlotBookingPage.js** (168 lines) - Slot booking interface
- **ChatPage.js** (186 lines) - Real-time chat UI
- **MaterialsPage.js** (120 lines) - Materials viewer

#### Services
- **api.js** (42 lines) - Axios API wrapper

#### Core Files
- **App.js** (47 lines) - Route definitions
- **index.js** (10 lines) - React initialization
- **public/index.html** (20 lines) - HTML entry

### Staff Portal Files (Similar structure)
- **components/** - Navbar, PrivateRoute (same as student)
- **context/** - AuthContext (same as student)
- **pages/** - Login, Register, Dashboard, SlotManagement, Chat, MaterialsUpload
- **services/** - api.js (with staff-specific endpoints)
- **App.js** - Staff route definitions
- **index.js** - React initialization
- **public/index.html** - HTML entry

## Package Dependencies

### Backend (server/package.json)
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "jwt-simple": "^0.5.6",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "socket.io": "^4.5.4",
  "dotenv": "^16.0.3"
}
```

### Frontend (student-client & staff-client)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "bootstrap": "^5.2.3",
  "socket.io-client": "^4.5.4"
}
```

## File Statistics

```
Total Files:     62
Total Lines:     ~4,850

Backend:
  Controllers:   4 files (~700 lines)
  Models:        4 files (~147 lines)
  Routes:        4 files (~81 lines)
  Middleware:    1 file (~32 lines)
  Core:          3 files (~147 lines)
  Config:        2 files (~30 lines)
  Subtotal:      18 files (~1,137 lines)

Student Portal:
  Components:    2 files (~78 lines)
  Context:       1 file (~62 lines)
  Pages:         6 files (~738 lines)
  Services:      1 file (~42 lines)
  Core:          3 files (~77 lines)
  Config:        3 files (~30 lines)
  Subtotal:      16 files (~1,027 lines)

Staff Portal:
  Components:    2 files (~78 lines)
  Context:       1 file (~62 lines)
  Pages:         6 files (~773 lines)
  Services:      1 file (~42 lines)
  Core:          3 files (~77 lines)
  Config:        3 files (~30 lines)
  Subtotal:      16 files (~1,062 lines)

Documentation:
  README.md:     ~250 lines
  QUICK_START.md: ~280 lines
  PROJECT_OVERVIEW.md: ~350 lines
  API_DOCUMENTATION.md: ~420 lines
  STRUCTURE.md:  ~180 lines
  Subtotal:      5 files (~1,480 lines)

Total: 62 files, ~4,706 lines of code
```

## Technology Summary

### Backend
- **Node.js** + Express 4.18.2
- **MongoDB** 5.0+ with Mongoose 7.0.0
- **JWT** for authentication
- **Bcrypt** for password security
- **Socket.io** 4.5.4 for real-time
- **CORS** for cross-origin requests

### Frontend
- **React** 18.2.0 with functional components
- **React Router** 6.8.0 for navigation
- **Axios** 1.3.0 for HTTP requests
- **Bootstrap** 5.2.3 for styling
- **Socket.io Client** 4.5.4 for real-time
- **Context API** for state management

### Development Tools
- **npm** for package management
- **nodemon** for auto-reload (backend)
- **react-scripts** for build tools

## Git Structure (Recommended)

```
.gitignore
├── /node_modules (all apps)
├── .env files
├── /build (React)
└── .DS_Store
```

## Deployment Folders

After build:
```
production/
├── server/          # Node.js app
├── student-build/   # React optimized build
├── staff-build/     # React optimized build
└── .env
```

---

**Project Structure Version**: 1.0
**Total Size**: ~4,700 lines (production-ready)
**Status**: Complete & Documented ✅
