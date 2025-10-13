# TahitiSpeak Technical Setup Guide 🔧

**Local AI Configuration and Development Setup**

---

## 🎯 Overview

This guide covers the technical setup for TahitiSpeak, including local AI configuration with Llama 3.1 DeepSeek model, environment setup, and troubleshooting for optimal performance.

### Key Features
- **Local AI Processing**: Privacy-focused with Llama 3.1 DeepSeek
- **No External API Dependencies**: Fully self-contained
- **Real-time Pronunciation Feedback**: Local speech processing
- **Offline Capability**: Core features work without internet

---

## 🛠️ Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux Ubuntu 18.04+
- **RAM**: 8GB minimum, 16GB recommended for local AI
- **Storage**: 10GB free space (for AI models)
- **CPU**: Modern multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **GPU**: Optional but recommended for faster AI processing

### Required Software
1. **Node.js 20.17.0+**: https://nodejs.org
2. **Git**: https://git-scm.com
3. **Ollama** (for local AI): https://ollama.ai

---

## 🚀 Installation Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/Rubling66/TahitiSpeak.git
cd TahitiSpeak
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Local AI (Ollama)

#### Install Ollama
1. **Download** from https://ollama.ai
2. **Install** following platform-specific instructions
3. **Verify** installation:
   ```bash
   ollama --version
   ```

#### Download Llama 3.1 DeepSeek Model
```bash
ollama pull llama3.1-deepseek
```

#### Start Ollama Service
```bash
ollama serve
```

### Step 4: Environment Configuration

#### Copy Environment Template
```bash
cp .env.local.example .env.local
```

#### Configure .env.local
```env
# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Local AI Configuration
LOCAL_AI_ENDPOINT=http://localhost:11434
LOCAL_AI_MODEL=llama3.1-deepseek
LOCAL_AI_TEMPERATURE=0.7
LOCAL_AI_MAX_TOKENS=2048
LOCAL_AI_TIMEOUT=30000

# Optional: Google AI (commented out for local-only setup)
# GOOGLE_AI_API_KEY=your-google-ai-key

# Optional: External APIs (not required for core functionality)
# OPENAI_API_KEY=your-openai-key
# DEEPSEEK_API_KEY=your-deepseek-key
# GOOGLE_TRANSLATE_API_KEY=your-translate-key
# CANVA_API_KEY=your-canva-key
```

### Step 5: Database Setup
```bash
npm run db:push
npm run db:seed
```

### Step 6: Start the Application
```bash
npm run dev
```

The application will be available at: http://localhost:3000

---

## 🔧 Local AI Configuration Details

### Ollama Service Management

#### Start Ollama (if not running)
```bash
ollama serve
```

#### Check Available Models
```bash
ollama list
```

#### Test Model Connection
```bash
ollama run llama3.1-deepseek "Hello, how are you?"
```

### Model Performance Optimization

#### GPU Acceleration (if available)
- Ollama automatically detects and uses GPU
- Check GPU usage: `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD)

#### Memory Management
- Default model size: ~4GB RAM
- Adjust model parameters in `.env.local` if needed:
  ```env
  LOCAL_AI_CONTEXT_LENGTH=4096
  LOCAL_AI_BATCH_SIZE=512
  ```

#### Performance Tuning
```env
# Faster responses, less accuracy
LOCAL_AI_TEMPERATURE=0.3
LOCAL_AI_MAX_TOKENS=1024

# Better quality, slower responses
LOCAL_AI_TEMPERATURE=0.8
LOCAL_AI_MAX_TOKENS=4096
```

---

## 🧪 Testing the Setup

### Verify Local AI Connection
1. **Open browser**: http://localhost:3000
2. **Navigate to**: Settings > AI Configuration
3. **Click**: "Test AI Connection"
4. **Expected result**: "✅ Local AI connected successfully"

### Test Core Features
1. **Translation**: Try French to Tahitian translation
2. **Pronunciation**: Test microphone and pronunciation feedback
3. **Lessons**: Start a basic lesson module
4. **Cultural Content**: Browse cultural information sections

### Performance Benchmarks
- **Translation response**: < 3 seconds
- **Pronunciation analysis**: < 2 seconds
- **Lesson generation**: < 5 seconds
- **Memory usage**: < 6GB total

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue: "Ollama not found" or "Connection refused"
**Symptoms**: AI features not working, connection errors

**Solutions**:
1. **Check Ollama service**:
   ```bash
   ollama serve
   ```
2. **Verify endpoint**: Ensure `LOCAL_AI_ENDPOINT=http://localhost:11434`
3. **Check firewall**: Allow port 11434
4. **Restart services**:
   ```bash
   # Stop Ollama
   pkill ollama
   # Start again
   ollama serve
   ```

#### Issue: "Model not found"
**Symptoms**: AI responses fail, model errors

**Solutions**:
1. **Download model**:
   ```bash
   ollama pull llama3.1-deepseek
   ```
2. **Verify model name** in `.env.local`
3. **Check available models**:
   ```bash
   ollama list
   ```

#### Issue: Slow AI Responses
**Symptoms**: Long wait times for translations/feedback

**Solutions**:
1. **Reduce model parameters**:
   ```env
   LOCAL_AI_MAX_TOKENS=1024
   LOCAL_AI_TEMPERATURE=0.3
   ```
2. **Close other applications** to free RAM
3. **Check system resources**: Task Manager/Activity Monitor
4. **Consider GPU acceleration** if available

#### Issue: High Memory Usage
**Symptoms**: System slowdown, out of memory errors

**Solutions**:
1. **Restart Ollama service**:
   ```bash
   ollama serve
   ```
2. **Reduce context length**:
   ```env
   LOCAL_AI_CONTEXT_LENGTH=2048
   ```
3. **Close unused applications**
4. **Consider smaller model** (if available)

#### Issue: Microphone Not Working
**Symptoms**: Pronunciation features unavailable

**Solutions**:
1. **Check browser permissions**: Allow microphone access
2. **Test microphone**: Use browser's microphone test
3. **Try different browser**: Chrome, Firefox, Safari
4. **Check system audio settings**
5. **Use HTTPS**: Some browsers require secure connection

---

## 🔒 Security and Privacy

### Local Processing Benefits
- **No data sent to external servers**
- **Complete privacy for user interactions**
- **No internet required for core features**
- **No API key management for basic functionality**

### Security Best Practices
1. **Keep software updated**: Regular updates for Node.js, Ollama
2. **Secure environment variables**: Don't commit `.env.local` to version control
3. **Firewall configuration**: Only open necessary ports
4. **Regular backups**: Backup user data and configurations

---

## 📊 Monitoring and Maintenance

### Performance Monitoring

#### Check System Resources
```bash
# CPU and Memory usage
top

# Disk usage
df -h

# Network connections
netstat -an | grep 11434
```

#### Application Logs
```bash
# Development logs
npm run dev

# Production logs
npm run start

# Ollama logs
ollama logs
```

### Regular Maintenance

#### Update Dependencies
```bash
npm update
```

#### Update Ollama
```bash
# Check for updates
ollama --version

# Update models
ollama pull llama3.1-deepseek
```

#### Database Maintenance
```bash
# Backup database
cp dev.db dev.db.backup

# Reset database (if needed)
npm run db:reset
npm run db:seed
```

---

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL="your-production-database-url"
# ... other production settings
```

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📞 Support and Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Ollama**: https://ollama.ai/docs
- **React**: https://react.dev

### Community Support
- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Community Q&A and sharing
- **Documentation**: Comprehensive guides and tutorials

### Development Tools
- **VS Code**: Recommended IDE with extensions
- **React DevTools**: Browser extension for debugging
- **Ollama CLI**: Command-line tools for model management

---

## 🎯 Next Steps

### For Developers
1. **Explore the codebase**: Understand the architecture
2. **Run tests**: `npm run test`
3. **Check code quality**: `npm run lint`
4. **Contribute**: Follow contribution guidelines

### For Beta Testers
1. **Complete setup**: Follow this guide step by step
2. **Test core features**: Use the beta testing guide
3. **Report issues**: Use the feedback template
4. **Share insights**: Provide educational assessment

### For Educators
1. **Evaluate content**: Check linguistic accuracy
2. **Test pedagogy**: Assess learning effectiveness
3. **Provide feedback**: Use the educator's guide
4. **Plan integration**: Consider classroom use

---

**Ready to explore TahitiSpeak!** 🌺

*This technical setup ensures optimal performance for the local AI-powered Tahitian language learning experience.*