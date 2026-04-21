# 📚 API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "student",
  "subject": "Mathematics" // Only for staff
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "phone": "+1234567890",
    "bio": "CS Student",
    "avatar": "https://..."
  }
}
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+9876543210",
  "bio": "Updated bio"
}

Response: 200 OK
{
  "success": true,
  "user": { /* updated user object */ }
}
```

### Get All Staff
```http
GET /auth/staff
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "staff": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Dr. Smith",
      "email": "smith@example.com",
      "subject": "Mathematics"
    },
    // ... more staff members
  ]
}
```

---

## 📅 Slot Endpoints

### Create Slot (Staff Only)
```http
POST /slots/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-02-20",
  "time": "14:30",
  "duration": 30,
  "topic": "Calculus Basics"
}

Response: 201 Created
{
  "success": true,
  "message": "Slot created successfully",
  "slot": {
    "_id": "507f1f77bcf86cd799439020",
    "staffId": "507f1f77bcf86cd799439012",
    "date": "2024-02-20",
    "time": "14:30",
    "duration": 30,
    "status": "Available",
    "topic": "Calculus Basics"
  }
}
```

### Get Staff Slots (Staff Only)
```http
GET /slots/staff
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "slots": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "staffId": { /* staff details */ },
      "studentId": { /* student details or null */ },
      "date": "2024-02-20",
      "time": "14:30",
      "status": "Available",
      "duration": 30
    }
  ]
}
```

### Get Available Slots (Student)
```http
GET /slots/available
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "slots": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "staffId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Smith",
        "subject": "Mathematics"
      },
      "date": "2024-02-20",
      "time": "14:30",
      "status": "Available"
    }
  ]
}
```

### Get Student's Booked Slots (Student)
```http
GET /slots/my-slots
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "slots": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "staffId": { /* staff details */ },
      "date": "2024-02-20",
      "time": "14:30",
      "status": "Booked",
      "duration": 30
    }
  ]
}
```

### Book Slot (Student)
```http
POST /slots/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "slotId": "507f1f77bcf86cd799439020"
}

Response: 200 OK
{
  "success": true,
  "message": "Slot booked successfully",
  "slot": {
    "_id": "507f1f77bcf86cd799439020",
    "studentId": "507f1f77bcf86cd799439011",
    "status": "Booked"
  }
}
```

### Cancel Booking (Student)
```http
POST /slots/{slotId}/cancel
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Booking cancelled successfully",
  "slot": {
    "_id": "507f1f77bcf86cd799439020",
    "studentId": null,
    "status": "Available"
  }
}
```

### Update Slot (Staff)
```http
PUT /slots/{slotId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-02-21",
  "time": "15:00",
  "duration": 45,
  "topic": "Advanced Calculus"
}

Response: 200 OK
{
  "success": true,
  "message": "Slot updated successfully",
  "slot": { /* updated slot */ }
}
```

### Delete Slot (Staff)
```http
DELETE /slots/{slotId}
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Slot deleted successfully"
}
```

---

## 💬 Chat Endpoints

### Send Message
```http
POST /chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": "507f1f77bcf86cd799439012",
  "message": "Hello, I need help with calculus"
}

Response: 201 Created
{
  "success": true,
  "message": "Message sent successfully",
  "chat": {
    "_id": "507f1f77bcf86cd799439030",
    "senderId": "507f1f77bcf86cd799439011",
    "receiverId": "507f1f77bcf86cd799439012",
    "message": "Hello, I need help with calculus",
    "timestamp": "2024-02-14T10:30:00.000Z"
  }
}
```

### Get Chat History
```http
GET /chat/history/{userId}
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439030",
      "senderId": "507f1f77bcf86cd799439011",
      "receiverId": "507f1f77bcf86cd799439012",
      "message": "Hello!",
      "timestamp": "2024-02-14T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439031",
      "senderId": "507f1f77bcf86cd799439012",
      "receiverId": "507f1f77bcf86cd799439011",
      "message": "Hi! How can I help?",
      "timestamp": "2024-02-14T10:31:00.000Z"
    }
  ]
}
```

### Get Chat List
```http
GET /chat/list
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Dr. Smith",
      "email": "smith@example.com"
    }
  ]
}
```

---

## 📚 Material Endpoints

### Upload Material (Staff Only)
```http
POST /materials/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Calculus Chapter 5",
  "description": "Complete notes on integration",
  "subject": "Mathematics",
  "topic": "Calculus",
  "fileUrl": "https://example.com/notes.pdf",
  "fileType": "pdf"
}

Response: 201 Created
{
  "success": true,
  "message": "Material uploaded successfully",
  "material": {
    "_id": "507f1f77bcf86cd799439040",
    "staffId": "507f1f77bcf86cd799439012",
    "title": "Calculus Chapter 5",
    "subject": "Mathematics",
    "fileUrl": "https://example.com/notes.pdf",
    "uploadedAt": "2024-02-14T10:30:00.000Z"
  }
}
```

### Get All Materials
```http
GET /materials
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "materials": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "staffId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Dr. Smith"
      },
      "title": "Calculus Chapter 5",
      "description": "Complete notes",
      "subject": "Mathematics",
      "topic": "Calculus",
      "fileUrl": "https://example.com/notes.pdf",
      "fileType": "pdf",
      "uploadedAt": "2024-02-14T10:30:00.000Z"
    }
  ]
}
```

### Get Staff Materials (Staff Only)
```http
GET /materials/staff
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "materials": [ /* materials uploaded by this staff */ ]
}
```

### Update Material (Staff Only)
```http
PUT /materials/{materialId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "fileUrl": "https://example.com/updated.pdf"
}

Response: 200 OK
{
  "success": true,
  "message": "Material updated successfully",
  "material": { /* updated material */ }
}
```

### Delete Material (Staff Only)
```http
DELETE /materials/{materialId}
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Material deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Only staff can access this"
}
```

### 404 Not Found
```json
{
  "error": "Slot not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## WebSocket Events (Socket.io)

### Client Events

#### user_join
Emitted when user connects
```javascript
socket.emit('user_join', userId);
```

#### send_message
Send a real-time message
```javascript
socket.emit('send_message', {
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f1f77bcf86cd799439012',
  message: 'Hello!'
});
```

#### user_typing
Notify when user is typing
```javascript
socket.emit('user_typing', {
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f1f77bcf86cd799439012'
});
```

#### user_stop_typing
Notify when user stops typing
```javascript
socket.emit('user_stop_typing', {
  senderId: '507f1f77bcf86cd799439011',
  receiverId: '507f1f77bcf86cd799439012'
});
```

### Server Events

#### receive_message
Receive incoming message
```javascript
socket.on('receive_message', (data) => {
  console.log(data.senderId, data.message);
});
```

#### message_sent
Confirmation that message was sent
```javascript
socket.on('message_sent', (data) => {
  console.log('Message delivered:', data._id);
});
```

#### user_online
User came online
```javascript
socket.on('user_online', (data) => {
  console.log(data.userId, 'is online');
});
```

#### user_offline
User went offline
```javascript
socket.on('user_offline', (data) => {
  console.log(data.userId, 'went offline');
});
```

#### user_typing_status
User is typing
```javascript
socket.on('user_typing_status', (data) => {
  console.log(data.senderId, 'is typing...');
});
```

#### user_stop_typing_status
User stopped typing
```javascript
socket.on('user_stop_typing_status', (data) => {
  console.log(data.senderId, 'stopped typing');
});
```

---

## Status Codes Reference

```
200 OK              - Request successful
201 Created         - Resource created successfully
400 Bad Request     - Invalid request parameters
401 Unauthorized    - Missing or invalid token
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource not found
500 Internal Error  - Server error
```

---

## Rate Limiting (Future Enhancement)

```
Per User Per Minute:
- 60 requests for GET
- 30 requests for POST/PUT/DELETE
- 100 requests for total
```

---

## Pagination (Future Enhancement)

```http
GET /materials?page=1&limit=10
GET /slots/staff?page=1&limit=20
```

---

**API Documentation Version**: 1.0
**Last Updated**: February 2026
**Status**: Complete ✅
