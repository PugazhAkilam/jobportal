# 🚀 Job Portal API

A comprehensive job portal system built with Node.js, Express, Prisma, and Socket.IO featuring authentication, resume building, job management, and real-time chat.

## 🏗️ **Architecture Overview**

### **Tech Stack**
- **Backend**: Node.js, Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens), Google OAuth
- **Real-time**: Socket.IO for chat
- **File Upload**: Multer for PDF resumes
- **PDF Generation**: Puppeteer with streaming
- **Event System**: Node.js EventEmitter

### **Key Features**
✅ **Role-based Authentication** (User, Recruiter, Admin)  
✅ **Resume Builder** with PDF generation  
✅ **Job Management** with applications tracking  
✅ **Real-time Chat** between users and recruiters  
✅ **File Upload** handling for resumes  
✅ **Event-driven Architecture** for notifications  
✅ **Google OAuth Integration**  
✅ **Comprehensive Error Handling**  

## 🚀 **Quick Start**

### **1. Installation**
```bash
# Clone and install dependencies
npm install

# Install additional dependencies
npm install nodemon --save-dev
```

### **2. Environment Setup**
```bash
# Copy environment file
cp .env.example .env

# Update .env with your values
DATABASE_URL="mysql://username:password@localhost:3306/jobportal"
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### **3. Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### **4. Start Server**
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 **API Endpoints**

### **🔐 Authentication Routes** (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | Login user | ❌ |
| POST | `/refresh` | Refresh access token | ❌ |
| GET | `/google` | Google OAuth login | ❌ |
| GET | `/google/callback` | Google OAuth callback | ❌ |
| GET | `/me` | Get current user | ✅ |

### **👤 User Routes** (`/api/users`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/profile` | Get user profile | ✅ | Any |
| PUT | `/profile` | Update profile | ✅ | Any |
| GET | `/applications` | Get user's applications | ✅ | USER |
| GET | `/jobs` | Get recruiter's jobs | ✅ | RECRUITER/ADMIN |
| GET | `/` | Get all users | ✅ | ADMIN |
| PATCH | `/:id/role` | Update user role | ✅ | ADMIN |

### **💼 Job Routes** (`/api/jobs`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all jobs (with filters) | ❌ | Any |
| GET | `/:id` | Get single job | ❌ | Any |
| POST | `/` | Create job | ✅ | RECRUITER/ADMIN |
| PUT | `/:id` | Update job | ✅ | RECRUITER/ADMIN |
| DELETE | `/:id` | Delete job | ✅ | RECRUITER/ADMIN |
| POST | `/:id/apply` | Apply for job | ✅ | USER |
| GET | `/:id/applications` | Get job applications | ✅ | RECRUITER/ADMIN |
| PATCH | `/applications/:id/status` | Update application status | ✅ | RECRUITER/ADMIN |

### **📄 Resume Routes** (`/api/resumes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get user's resumes | ✅ |
| GET | `/:id` | Get single resume | ✅ |
| POST | `/` | Create resume | ✅ |
| PUT | `/:id` | Update resume | ✅ |
| DELETE | `/:id` | Delete resume | ✅ |
| GET | `/:id/pdf` | Generate PDF | ✅ |

### **💬 Chat Routes** (`/api/chat`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/history/:userId` | Get chat history | ✅ |
| GET | `/conversations` | Get all conversations | ✅ |
| POST | `/send` | Send message | ✅ |
| GET | `/available-users` | Get users for chat | ✅ |

## 🔌 **Socket.IO Events**

### **Client → Server**
```javascript
// Join user room
socket.emit('join', userId);

// Send message
socket.emit('sendMessage', {
  senderId: 1,
  receiverId: 2,
  message: "Hello!"
});

// Typing indicators
socket.emit('typing', { senderId: 1, receiverId: 2 });
socket.emit('stopTyping', { senderId: 1, receiverId: 2 });
```

### **Server → Client**
```javascript
// Receive message
socket.on('messageReceived', (message) => {
  console.log('New message:', message);
});

// Typing indicators
socket.on('userTyping', ({ senderId, isTyping }) => {
  console.log(`User ${senderId} is ${isTyping ? 'typing' : 'stopped typing'}`);
});

// Errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 📊 **Database Schema**

### **User Model**
```javascript
{
  id: Int (Primary Key)
  name: String
  email: String (Unique)
  password: String? (Optional for OAuth)
  googleId: String? (Optional)
  role: Enum (USER, RECRUITER, ADMIN)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### **Resume Model**
```javascript
{
  id: Int (Primary Key)
  title: String
  content: JSON {
    profile: { name, email, phone, location, summary }
    education: [{ degree, institution, year, grade }]
    experience: [{ role, company, duration, description }]
    skills: [{ name, proficiency }]
    projects: [{ title, description, techStack, links }]
  }
  userId: Int (Foreign Key)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### **Job Model**
```javascript
{
  id: Int (Primary Key)
  title: String
  description: Text
  company: String
  location: String?
  salary: String?
  skills: String?
  status: String (OPEN/CLOSED)
  recruiterId: Int (Foreign Key)
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🎯 **Event System**

The application uses Node.js EventEmitter for decoupled event handling:

```javascript
// User registration
eventEmitter.emit('user:registered', { userId, email, name, method });

// Job application
eventEmitter.emit('job:applied', { applicationId, userId, jobId, recruiterId });

// Application status change
eventEmitter.emit('application:statusChanged', { applicationId, userId, status });

// New chat message
eventEmitter.emit('chat:newMessage', { senderId, receiverId, message });
```

## 🌊 **Streaming & File Handling**

### **PDF Generation with Streams**
```javascript
// Efficient PDF generation using Puppeteer
const pdfBuffer = await generateResumePDF(resumeData);
res.setHeader('Content-Type', 'application/pdf');
res.end(pdfBuffer); // Stream to client
```

### **File Upload with Multer**
```javascript
// PDF-only upload with 5MB limit
const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  }
});
```

## 🔒 **Security Features**

- **JWT Access/Refresh Token Flow** (15min/7day expiry)
- **Password Hashing** with bcrypt (12 rounds)
- **Role-based Access Control** middleware
- **Input Validation** and sanitization
- **File Type Validation** (PDF only)
- **CORS Configuration**
- **Environment Variable Protection**

## 🚀 **Production Deployment**

### **Environment Variables**
```bash
NODE_ENV=production
DATABASE_URL="your-production-db-url"
JWT_ACCESS_SECRET="strong-production-secret"
JWT_REFRESH_SECRET="strong-production-refresh-secret"
```

### **PM2 Configuration**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "job-portal-api"

# Monitor
pm2 monit
```

## 📈 **Performance Optimizations**

- **Database Indexing** on frequently queried fields
- **Pagination** for large datasets
- **Streaming** for file operations
- **Connection Pooling** with Prisma
- **Efficient Queries** with proper includes/selects

## 🧪 **Testing**

```bash
# Run tests (when implemented)
npm test

# Test database connection
curl http://localhost:5000/test-db
```

## 📝 **Sample API Usage**

### **Register & Login**
```javascript
// Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'USER'
  })
});

// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});
```

### **Create Resume**
```javascript
const resumeData = {
  title: "Software Developer Resume",
  content: {
    profile: {
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      location: "New York, NY",
      summary: "Experienced software developer..."
    },
    education: [{
      degree: "Bachelor of Computer Science",
      institution: "MIT",
      year: "2020",
      grade: "3.8 GPA"
    }],
    experience: [{
      role: "Software Developer",
      company: "Tech Corp",
      duration: "2020-2023",
      description: "Developed web applications..."
    }],
    skills: [{
      name: "JavaScript",
      proficiency: "Expert"
    }],
    projects: [{
      title: "E-commerce Platform",
      description: "Built a full-stack e-commerce solution",
      techStack: "React, Node.js, MongoDB",
      links: "https://github.com/johndoe/ecommerce"
    }]
  }
};

const response = await fetch('/api/resumes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(resumeData)
});
```

This job portal system provides a complete, production-ready foundation with modern architecture patterns, comprehensive security, and scalable design.