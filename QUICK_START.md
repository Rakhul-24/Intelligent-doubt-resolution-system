# 🚀 QUICK START GUIDE

## ⚡ TL;DR - 3 Terminal Approach

### Terminal 1 - Backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:5000
```

### Terminal 2 - Student Portal
```bash
cd student-client
npm install
npm start
# Opens http://localhost:3000
```

### Terminal 3 - Staff Portal
```bash
cd staff-client
npm install
npm start
# Opens http://localhost:3001
```

---

## 🔐 Test Credentials

### Create Test Accounts

**Student Account:**
- Register at student portal (http://localhost:3000/register)
- Name: John Student
- Email: student@example.com
- Password: password123

**Staff Account:**
- Register at staff portal (http://localhost:3001/register)
- Name: Dr. Smith
- Email: staff@example.com
- Password: password123
- Subject: Mathematics

---

## ✅ System Requirements

- Node.js v14+ (https://nodejs.org/)
- MongoDB (local or Atlas: https://mongodb.com/)
- npm (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 📋 Step-by-Step Installation

### 1. Prerequisites Check
```bash
# Verify Node.js
node --version  # Should be v14+

# Verify npm
npm --version   # Should be v6+
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
```bash
# macOS (Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download and install from https://www.mongodb.com/try/download/community
# Run: mongod

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster
4. Get connection string
5. Replace in server/.env: `MONGODB_URI=your_connection_string`

### 3. Backend Installation

```bash
cd server

# Install dependencies
npm install

# Verify .env file
cat .env  # Should show MONGODB_URI, JWT_SECRET, PORT

# Start server
npm start

# Expected output:
# ✓ Server running on http://localhost:5000
# ✓ MongoDB Connected
```

### 4. Student Portal Installation

```bash
cd student-client

# Install dependencies
npm install

# Start development server
npm start

# Browser will open automatically at http://localhost:3000
# If not, manually visit: http://localhost:3000
```

### 5. Staff Portal Installation

```bash
cd staff-client

# Install dependencies
npm install

# Start development server (will use different port)
npm start

# Browser will open at http://localhost:3001
```

---

## 🎯 Testing the Application

### 1. Create Student Account
- Go to: http://localhost:3000
- Click "Register here"
- Fill form and submit
- You're now logged in to student dashboard

### 2. Create Staff Account
- Go to: http://localhost:3001
- Click "Register here"
- Fill form with subject (e.g., "Mathematics")
- Submit and login

### 3. Test Slots Feature
1. **Staff Portal**: Go to "Manage Slots" → "Create New Slot"
2. Enter future date and time
3. Click "Create Slot"
4. **Student Portal**: Go to "Book Slots"
5. Find the staff member's slot
6. Click "Book Slot"
7. Verify booking shows in "My Bookings"

### 4. Test Real-time Chat
1. **Staff Portal**: Go to "Chat"
2. **Student Portal**: Go to "Chat" (same time in separate window/browser)
3. Select staff member in student portal
4. Type and send message
5. Message appears instantly in staff portal
6. Reply from staff
7. See reply instantly in student portal

### 5. Test Materials
1. **Staff Portal**: Go to "Materials"
2. Click "Upload Material"
3. Fill form:
   - Title: "Algebra Notes"
   - Subject: "Mathematics"
   - File URL: `https://example.com/notes.pdf`
   - File Type: PDF
4. Click "Upload"
5. **Student Portal**: Go to "Materials"
6. Find and download the material

---

## 🔧 Troubleshooting

### Problem: Cannot connect to MongoDB
```
Error: MongoError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Check if mongod is running: `ps aux | grep mongod`
- Start MongoDB: `mongod` or `brew services start mongodb-community`
- Or use MongoDB Atlas and update MONGODB_URI in .env

### Problem: Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3002 npm start
```

### Problem: npm install fails
```
Error: npm ERR! code ERESOLVE
```
**Solution:**
```bash
# Use legacy dependency resolution
npm install --legacy-peer-deps

# Or upgrade npm
npm install -g npm@latest
```

### Problem: Socket.io connection fails
```
Error: WebSocket connection to 'ws://localhost:5000/...' failed
```
**Solution:**
- Verify backend running: http://localhost:5000/health (should return JSON)
- Check firewall isn't blocking port 5000
- Restart backend: Press Ctrl+C and run `npm start` again

### Problem: Login returns 401 Unauthorized
```
Error: Invalid email or password
```
**Solution:**
- Verify email exists in database
- Verify password is correct
- Ensure role matches (student portal → role:student, staff portal → role:staff)
- Clear localStorage and try again

### Problem: Pages show blank or 404
```
TypeError: Cannot read property of undefined
```
**Solution:**
- Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear browser cache: DevTools → Application → Clear storage
- Verify backend is running and responding

---

## 📊 File Structure Check

Verify all files are present:

```bash
# Backend
server/
├── controllers/ (4 files)
├── models/ (4 files)
├── routes/ (4 files)
├── middleware/ (1 file)
├── socket.js
├── server.js
├── package.json
└── .env

# Student Client
student-client/
├── src/
│   ├── components/ (2 files)
│   ├── context/ (1 file)
│   ├── pages/ (6 files)
│   ├── services/ (1 file)
│   ├── App.js
│   └── index.js
├── public/
│   └── index.html
└── package.json

# Staff Client
staff-client/
├── src/
│   ├── components/ (2 files)
│   ├── context/ (1 file)
│   ├── pages/ (6 files)
│   ├── services/ (1 file)
│   ├── App.js
│   └── index.js
├── public/
│   └── index.html
└── package.json
```

---

## 🎓 Learning Resources

### Next Steps After Setup

1. **Understand the Flow**
   - Check `server.js` for Express setup
   - See `socket.js` for real-time messaging
   - Review `AuthContext.js` for state management

2. **Modify Features**
   - Add new slots fields in `Slot.js` model
   - Create new API endpoints in controllers
   - Add new pages in `pages/` directory

3. **Customize UI**
   - Modify Bootstrap classes in components
   - Change color scheme (primary, success, etc.)
   - Adjust responsive layout

4. **Deploy**
   - Backend: Heroku, Railway, Render
   - Frontend: Vercel, Netlify, GitHub Pages

---

## 🎉 You're All Set!

Visit:
- **Student Portal**: http://localhost:3000
- **Staff Portal**: http://localhost:3001
- **Backend API**: http://localhost:5000/health

Happy coding! 🚀
