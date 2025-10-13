// Mock API server for testing purposes
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// Rate limiting store
const rateLimitStore = new Map();

// Helper function to clear rate limit store (for testing)
const clearRateLimit = () => {
  rateLimitStore.clear();
};

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Rate limiting middleware
const rateLimit = (maxRequests = 5, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    const requests = rateLimitStore.get(key);
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    validRequests.push(now);
    rateLimitStore.set(key, validRequests);
    next();
  };
};

// Middleware
app.use(cors());
app.use(express.json());

// Mock database
const users = [
  {
    id: 'admin_1',
    email: 'admin@test.com',
    password: 'AdminPass123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];
const enrollments = [];
const auditLogs = [];
const reports = [];
const systemLogs = [];
let maintenanceMode = { enabled: false, message: '', endTime: null };
const courses = [
  {
    id: 'course_1',
    title: 'French Basics',
    description: 'Learn basic French vocabulary and grammar',
    isPublished: true,
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  },
  {
    id: 'course_2', 
    title: 'Tahitian Culture',
    description: 'Explore Tahitian traditions and customs',
    isPublished: false,
    createdAt: new Date().toISOString()
  }
];
const lessons = [
  {
    id: 'lesson_1',
    courseId: 'course_1',
    title: 'Greetings in French',
    content: 'Learn how to say hello and goodbye',
    order: 1
  }
];
const JWT_SECRET = 'test-secret';

// Authentication middleware
const authenticateToken = (req, res, next) => {
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
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      errors: ['All fields are required'] 
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ errors: ['Invalid email format'] });
  }
  
  // Validate password strength (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ errors: ['Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'] });
  }
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
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

app.post('/api/auth/login', rateLimit(10, 60000), (req, res) => {
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
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ token, refreshToken, user: userWithoutPassword });
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

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/refresh', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }
  
  const refreshToken = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate a new token with current timestamp to ensure it's different
    const newToken = jwt.sign({ 
      userId: user.id, 
      iat: Math.floor(Date.now() / 1000) 
    }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ errors: ['Email is required'] });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ errors: ['Invalid email format'] });
  }
  
  // For security reasons, always return success even if user doesn't exist
  // In a real app, you would send an email here if user exists
  res.json({ message: 'Password reset email sent' });
});

app.put('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  const { firstName, lastName, email, bio } = req.body;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ errors: ['Invalid email format'] });
    }
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    
    if (userIndex === -1) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Update user profile
    if (firstName) users[userIndex].firstName = firstName;
    if (lastName) users[userIndex].lastName = lastName;
    if (bio !== undefined) users[userIndex].bio = bio;
    if (email) {
      // Check if email is already taken
      const existingUser = users.find(u => u.email === email && u.id !== decoded.userId);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      users[userIndex].email = email;
    }
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All password fields are required' });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    
    if (userIndex === -1) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    users[userIndex].password = newPassword;
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.put('/api/auth/password', (req, res) => {
  const authHeader = req.headers.authorization;
  const { currentPassword, newPassword } = req.body;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ errors: ['Current password and new password are required'] });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    
    if (userIndex === -1) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = users[userIndex];
    
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    users[userIndex].password = newPassword;
    
    res.json({ message: 'Password updated successfully' });
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

// Admin endpoints
app.get('/api/admin/dashboard', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const stats = {
    totalUsers: users.length,
    totalCourses: 1,
    totalLessons: 1,
    activeUsers: users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  };
  res.json({ dashboard: stats });
});

// Admin users management
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  let filteredUsers = [...users];
  
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  
  if (search) {
    filteredUsers = filteredUsers.filter(u => 
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  res.json({
    users: paginatedUsers.map(u => ({ ...u, password: undefined })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length,
      pages: Math.ceil(filteredUsers.length / limit)
    }
  });
});

app.get('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: { ...user, password: undefined } });
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  
  const { firstName, lastName, email, role } = req.body;
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Check email uniqueness
  if (email && users.some(u => u.email === email && u.id !== req.params.id)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  // Validate role
  if (role && !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    firstName: firstName || users[userIndex].firstName,
    lastName: lastName || users[userIndex].lastName,
    email: email || users[userIndex].email,
    role: role || users[userIndex].role,
    updatedAt: new Date().toISOString()
  };
  
  res.json({ user: { ...users[userIndex], password: undefined } });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Prevent self-deletion
  if (users[userIndex].id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  // Check for active enrollments (mock check)
  const hasActiveEnrollments = false; // In real app, check database
  if (hasActiveEnrollments) {
    return res.status(400).json({ error: 'Cannot delete user with active enrollments' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

app.post('/api/admin/users/:id/suspend', authenticateToken, requireAdmin, (req, res) => {
  
  const { reason, duration } = req.body;
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!reason) {
    return res.status(400).json({ error: 'Suspension reason is required' });
  }
  
  if (!duration || duration <= 0) {
    return res.status(400).json({ error: 'Valid suspension duration is required' });
  }
  
  users[userIndex].suspended = {
    reason,
    duration,
    suspendedAt: new Date().toISOString()
  };
  
  res.json({ user: { ...users[userIndex], password: undefined } });
});

app.post('/api/admin/users/:id/unsuspend', authenticateToken, requireAdmin, (req, res) => {
  
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!users[userIndex].suspended) {
    return res.status(400).json({ error: 'User is not suspended' });
  }
  
  delete users[userIndex].suspended;
  users[userIndex].unsuspendedAt = new Date().toISOString();
  
  res.json({ user: { ...users[userIndex], password: undefined } });
});

// Admin courses management
app.get('/api/admin/courses', authenticateToken, requireAdmin, (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  let filteredCourses = [...courses];
  
  if (status) {
    filteredCourses = filteredCourses.filter(c => 
      status === 'published' ? c.isPublished : !c.isPublished
    );
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
  
  res.json({ 
    courses: paginatedCourses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredCourses.length,
      totalPages: Math.ceil(filteredCourses.length / limit)
    }
  });
});

app.put('/api/admin/courses/:id/publish', authenticateToken, requireAdmin, (req, res) => {
  const courseIndex = courses.findIndex(c => c.id === req.params.id);
  
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  courses[courseIndex].isPublished = true;
  courses[courseIndex].publishedAt = new Date().toISOString();
  
  res.json({ course: courses[courseIndex] });
});

app.put('/api/admin/courses/:id/unpublish', authenticateToken, requireAdmin, (req, res) => {
  const courseIndex = courses.findIndex(c => c.id === req.params.id);
  
  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  courses[courseIndex].isPublished = false;
  courses[courseIndex].unpublishedAt = new Date().toISOString();
  
  res.json({ course: courses[courseIndex] });
});

// Admin analytics
app.get('/api/admin/analytics', authenticateToken, requireAdmin, (req, res) => {
  const { startDate, endDate } = req.query;
  
  const analytics = {
    userGrowth: {
      total: users.length,
      newThisMonth: users.filter(u => 
        new Date(u.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      activeUsers: users.filter(u => 
        u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    },
    coursePerformance: {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.isPublished).length,
      averageRating: 4.5,
      completionRate: 0.75
    },
    revenueMetrics: {
      totalRevenue: 50000,
      monthlyRevenue: 5000,
      averageOrderValue: 99.99
    },
    engagementMetrics: {
      dailyActiveUsers: Math.floor(users.length * 0.3),
      sessionDuration: 45,
      pageViews: 10000
    }
  };
  
  if (startDate && endDate) {
    analytics.dateRange = { start: startDate, end: endDate };
  }
  
  res.json({ analytics });
});

// Admin reports
app.get('/api/admin/reports', authenticateToken, requireAdmin, (req, res) => {
  const reports = [
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Detailed user activity and engagement metrics',
      type: 'analytics'
    },
    {
      id: 'course-performance',
      name: 'Course Performance Report',
      description: 'Course completion rates and user feedback',
      type: 'education'
    },
    {
      id: 'revenue-summary',
      name: 'Revenue Summary',
      description: 'Financial performance and revenue trends',
      type: 'financial'
    }
  ];
  
  res.json({ reports });
});

app.post('/api/admin/reports/generate', authenticateToken, requireAdmin, (req, res) => {
  const { type, format, dateRange } = req.body;
  
  const validTypes = ['user-activity', 'course-performance', 'revenue-summary'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ errors: ['Invalid report type'] });
  }
  
  const reportId = `report_${Date.now()}`;
  const report = {
    id: reportId,
    type,
    format: format || 'csv',
    status: 'completed',
    downloadUrl: `/api/admin/reports/${reportId}/download`,
    createdAt: new Date().toISOString(),
    dateRange
  };
  
  res.json({ report });
});

// System health and monitoring
app.get('/api/admin/system/health', authenticateToken, requireAdmin, (req, res) => {
  const health = {
    status: 'healthy',
    services: {
      database: { status: 'healthy', responseTime: 15 },
      redis: { status: 'healthy', responseTime: 5 },
      storage: { status: 'healthy', responseTime: 20 }
    },
    metrics: {
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
  };
  
  res.json({ health });
});

app.get('/api/admin/system/logs', authenticateToken, requireAdmin, (req, res) => {
  const { level, page = 1, limit = 50 } = req.query;
  
  // Mock system logs
  let logs = [
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'User authentication successful',
      source: 'auth-service'
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      level: 'error',
      message: 'Database connection timeout',
      source: 'database'
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'warn',
      message: 'High memory usage detected',
      source: 'system-monitor'
    }
  ];
  
  if (level) {
    logs = logs.filter(log => log.level === level);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  res.json({
    logs: paginatedLogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: logs.length,
      pages: Math.ceil(logs.length / limit)
    }
  });
});

// Maintenance mode endpoint

app.post('/api/admin/system/maintenance', authenticateToken, requireAdmin, (req, res) => {
  const { enabled, message, estimatedDuration } = req.body;
  
  maintenanceMode = {
    enabled,
    message: message || null,
    estimatedDuration: estimatedDuration || null,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user.id
  };
  
  res.json({ maintenance: maintenanceMode });
});

// Audit logs
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, (req, res) => {
  const { action, page = 1, limit = 50 } = req.query;
  
  // Mock audit logs
  let auditLogs = [
    {
      id: 'audit_1',
      action: 'user.create',
      userId: 'user_123',
      timestamp: new Date().toISOString(),
      details: { email: 'newuser@example.com', role: 'user' },
      ipAddress: '192.168.1.1'
    },
    {
      id: 'audit_2',
      action: 'course.publish',
      userId: 'admin_456',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      details: { courseId: 'course_789', title: 'French Basics' },
      ipAddress: '192.168.1.2'
    },
    {
      id: 'audit_3',
      action: 'user.suspend',
      userId: 'admin_456',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      details: { targetUserId: 'user_999', reason: 'Policy violation' },
      ipAddress: '192.168.1.2'
    }
  ];
  
  if (action) {
    auditLogs = auditLogs.filter(log => log.action === action);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = auditLogs.slice(startIndex, endIndex);
  
  res.json({
    auditLogs: paginatedLogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: auditLogs.length,
      pages: Math.ceil(auditLogs.length / limit)
    }
  });
});

// Course enrollment endpoint
app.post('/api/courses/:id/enroll', authenticateToken, (req, res) => {
  const courseId = req.params.id;
  const course = courses.find(c => c.id === courseId);
  
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  // Mock enrollment - just return success
  res.json({ 
    message: 'Enrolled successfully',
    enrollment: {
      userId: req.user.id,
      courseId,
      enrolledAt: new Date().toISOString()
    }
  });
});

// Email routes
const emailRoutes = require('./email');
app.use('/api/email', emailRoutes);

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
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app, clearRateLimit };

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Mock API server running on port ${PORT}`);
  });
}