// Mock API server for testing purposes
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock database
const users = [];
const JWT_SECRET = 'test-secret';

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      errors: ['All fields are required'] 
    });
  }
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ 
      error: 'User already exists' 
    });
  }
  
  // Create user
  const user = {
    id: Date.now().toString(),
    email,
    firstName,
    lastName,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  users.push({ ...user, password });
  
  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  
  res.status(201).json({ user, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      errors: ['Email and password are required'] 
    });
  }
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);
  
  res.json({ user: userWithoutPassword, token });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Courses routes
app.get('/api/courses', (req, res) => {
  res.json({
    courses: [
      {
        id: '1',
        title: 'Basic Tahitian',
        description: 'Learn basic Tahitian phrases',
        level: 'beginner',
        lessons: 10
      }
    ]
  });
});

app.get('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    title: 'Basic Tahitian',
    description: 'Learn basic Tahitian phrases',
    level: 'beginner',
    lessons: [
      {
        id: '1',
        title: 'Greetings',
        content: 'Learn basic greetings in Tahitian'
      }
    ]
  });
});

// Lessons routes
app.get('/api/lessons/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    title: 'Greetings',
    content: 'Learn basic greetings in Tahitian',
    exercises: [
      {
        id: '1',
        type: 'translation',
        question: 'How do you say "Hello" in Tahitian?',
        answer: 'Ia ora na'
      }
    ]
  });
});

// Admin routes
app.get('/api/admin/users', (req, res) => {
  // Mock admin check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  res.json({
    users: users.map(({ password, ...user }) => user)
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app };

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Mock API server running on port ${PORT}`);
  });
}