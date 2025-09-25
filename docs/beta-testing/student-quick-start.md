# TahitiSpeak Student Quick Start Guide 🌺

**For Students: How to Download and Run the Tahitian Language Learning App**

---

## 📋 What You Need First (Prerequisites)

### Step 1: Install Node.js
1. **Go to**: https://nodejs.org
2. **Download**: The "LTS" version (recommended for most users)
3. **Install**: Run the downloaded file and follow the installation wizard
4. **Verify**: Open Command Prompt (Windows) or Terminal (Mac) and type:
   ```
   node --version
   ```
   You should see a version number like `v20.17.0`

### Step 2: Install Git (if not already installed)
1. **Go to**: https://git-scm.com/downloads
2. **Download**: Git for your operating system
3. **Install**: Follow the installation instructions

---

## 📥 Download the Application from GitHub

### Method 1: Using Git (Recommended)
1. **Open** Command Prompt (Windows) or Terminal (Mac/Linux)
2. **Navigate** to where you want to save the app (like Desktop):
   ```
   cd Desktop
   ```
3. **Download** the application:
   ```
   git clone https://github.com/Rubling66/TahitiSpeak.git
   ```
4. **Enter** the application folder:
   ```
   cd TahitiSpeak
   ```

### Method 2: Direct Download (Alternative)
1. **Go to**: https://github.com/Rubling66/TahitiSpeak
2. **Click**: The green "Code" button
3. **Select**: "Download ZIP"
4. **Extract**: The downloaded ZIP file to your Desktop
5. **Open** Command Prompt/Terminal and navigate to the extracted folder

---

## ⚙️ Set Up the Application

### Step 1: Install Dependencies
1. **Make sure** you're in the TahitiSpeak folder
2. **Run** this command:
   ```
   npm install
   ```
   ⏳ This will take a few minutes - be patient!

### Step 2: Set Up Environment
1. **Look for** a file called `.env.local.example` in the folder
2. **Copy** this file and rename the copy to `.env.local`
3. **Open** `.env.local` with any text editor (Notepad, TextEdit, etc.)
4. **The file should look like this** (no changes needed for basic use):
   ```
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   LOCAL_AI_ENDPOINT=http://localhost:11434
   LOCAL_AI_MODEL=llama3.1-deepseek
   ```

---

## 🚀 Run the Application

### Start the Application
1. **In Command Prompt/Terminal**, make sure you're in the TahitiSpeak folder
2. **Run** this command:
   ```
   npm run dev
   ```
3. **Wait** for the message: "Ready - started server on 0.0.0.0:3000"
4. **Open** your web browser and go to: http://localhost:3000

### 🎉 Success!
You should now see the TahitiSpeak application in your browser!

---

## 🎯 What to Do When the App Opens

### First Time Setup
1. **Choose your language**: Select English or French for the interface
2. **Create a profile**: Enter your name and learning level
3. **Set learning goals**: Choose what you want to learn (basic phrases, pronunciation, etc.)
4. **Allow microphone access**: Click "Allow" when prompted (needed for pronunciation practice)

### Start Learning
1. **Home Page**: See your learning progress and daily goals
2. **Lessons**: Click "Start Learning" to begin structured lessons
3. **Practice**: Try pronunciation exercises with real-time feedback
4. **Culture**: Learn about Tahitian culture and traditions
5. **Progress**: Track your learning journey

### Basic Navigation
- **Top Menu**: Navigate between different sections
- **Side Panel**: Quick access to lessons and features
- **Settings**: Adjust language, audio, and learning preferences

---

## 🔧 Troubleshooting Common Issues

### Problem: "npm is not recognized"
**Solution**: Node.js wasn't installed properly
- Reinstall Node.js from https://nodejs.org
- Restart your computer
- Try again

### Problem: "Port 3000 is already in use"
**Solution**: Another application is using port 3000
- Close other development applications
- Or use a different port:
  ```
  npm run dev -- --port 3001
  ```
  Then go to: http://localhost:3001

### Problem: Application won't load in browser
**Solutions**:
1. **Check** if the server is still running in Command Prompt/Terminal
2. **Try** refreshing the browser page
3. **Clear** browser cache and cookies
4. **Try** a different browser (Chrome, Firefox, Safari)

### Problem: "Cannot find module" errors
**Solution**: Dependencies weren't installed properly
- Delete the `node_modules` folder
- Run `npm install` again

### Problem: Microphone not working
**Solutions**:
1. **Check** browser permissions for microphone access
2. **Allow** microphone access when prompted
3. **Check** your computer's microphone settings
4. **Try** a different browser

---

## 💡 Tips for Students

### Learning Tips
- **Start with basics**: Begin with simple greetings and common phrases
- **Practice daily**: Even 10 minutes a day helps!
- **Use pronunciation features**: The AI feedback helps improve your accent
- **Explore culture**: Understanding culture helps with language learning

### Technical Tips
- **Keep the terminal open**: Don't close Command Prompt/Terminal while using the app
- **Use headphones**: Better audio quality for pronunciation practice
- **Good internet**: Ensure stable internet connection
- **Updated browser**: Use the latest version of your web browser

### Getting Help
- **Ask your teacher**: They can help with both technical and learning questions
- **Check the app's help section**: Built-in tutorials and guides
- **Practice with friends**: Learn together!

---

## 📱 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10, macOS 10.14, or Linux Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Internet**: Stable broadband connection
- **Microphone**: For pronunciation practice

### Recommended Setup
- **Headphones or speakers**: For clear audio
- **Quiet environment**: For better microphone recognition
- **Good lighting**: If using video features

---

## 🆘 Need More Help?

### If You're Stuck
1. **Ask your teacher**: They know the application and can help
2. **Check with classmates**: Someone might have solved the same problem
3. **Read error messages carefully**: They often tell you what's wrong
4. **Try restarting**: Close everything and start over

### Before Asking for Help
- **Note the exact error message**: Copy and paste it
- **Remember what you were doing**: When did the problem start?
- **Try basic solutions first**: Restart browser, refresh page
- **Check your internet connection**: Make sure you're online

---

## 🌟 Ready to Learn Tahitian!

**Congratulations!** You've successfully set up TahitiSpeak. Now you can:

✅ **Learn** French-Tahitian translations  
✅ **Practice** pronunciation with AI feedback  
✅ **Explore** Polynesian culture  
✅ **Track** your learning progress  
✅ **Have fun** while learning a beautiful language  

**Remember**: Learning a language takes time and practice. Be patient with yourself and enjoy the journey!

**Māuruuru roa!** (Thank you very much in Tahitian!) 🌺

---

*This guide was created to help students easily access and use TahitiSpeak for learning the beautiful Tahitian language. If you have suggestions for improving this guide, please share them with your teacher.*