# Tahiti French Tutor - React Native App

A French-Polynesian language learning mobile app built with React Native + Expo, featuring **FREE** Coqui TTS integration for unlimited text-to-speech functionality.

## 🌺 Features

- **Zero-Cost TTS Architecture**: Local Coqui TTS server with free pre-trained models
- **20 Essential Lessons**: Complete French-Polynesian language curriculum
- **Tab Navigation**: Learn, Practice, Culture, Profile, and TTS Test screens
- **Offline Capabilities**: Local content and audio files
- **Progress Tracking**: Basic learning progress system
- **Cultural Content**: Stories, traditions, and Polynesian wisdom
- **Production Ready**: Clean TypeScript code with error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g @expo/cli`
- Python 3.8+ (for Coqui TTS server)
- Git

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Coqui TTS Server (FREE)

#### Install Coqui TTS

```bash
# Install Coqui TTS globally
pip install TTS

# Verify installation
tts --help
```

#### Start TTS Server

```bash
# Start the TTS server on localhost:5002
tts-server --model_name "tts_models/fr/mai/tacotron2-DDC" --port 5002
```

#### Available Models (Free)

- **French**: `tts_models/fr/mai/tacotron2-DDC`
- **English**: `tts_models/en/ljspeech/tacotron2-DDC`

#### Test TTS Server

```bash
# Test French TTS
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour, bienvenue en Polynésie", "model": "tts_models/fr/mai/tacotron2-DDC"}'

# Test English TTS
curl -X POST http://localhost:5002/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, welcome to Polynesia", "model": "tts_models/en/ljspeech/tacotron2-DDC"}'
```

### 3. Run the App

```bash
# Start Expo development server
npm run start

# Or run on specific platform
npm run android
npm run ios
npm run web
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Empty.tsx
│   └── TTSTestComponent.tsx     # TTS testing interface
├── data/
│   └── lessons.ts               # 20 French-Polynesian lessons
├── hooks/
│   ├── useTheme.ts
│   └── useTTS.ts                # TTS state management
├── lib/
│   └── utils.ts
├── screens/
│   ├── LearnScreen.tsx          # 20 lessons display
│   ├── PracticeScreen.tsx       # Pronunciation practice
│   ├── CultureScreen.tsx        # Cultural stories
│   └── ProfileScreen.tsx        # User profile & settings
├── services/
│   └── TTSService.ts            # Coqui TTS integration
├── types/
│   └── tts.ts                   # TypeScript interfaces
└── App.tsx                      # Main navigation
```

## 🎯 TTS Integration

### Configuration

The app uses a local Coqui TTS server for unlimited, free text-to-speech:

```typescript
const FREE_TTS_CONFIG = {
  baseUrl: 'http://localhost:5002',
  timeout: 30000,
  retryAttempts: 3,
  models: {
    french: 'tts_models/fr/mai/tacotron2-DDC',
    english: 'tts_models/en/ljspeech/tacotron2-DDC'
  }
};
```

### Usage Example

```typescript
import { useTTS } from '../hooks/useTTS';

function MyComponent() {
  const { generateAndPlay, isLoading, error } = useTTS();

  const speakFrench = () => {
    generateAndPlay('Bonjour, bienvenue en Polynésie', 'french');
  };

  return (
    <TouchableOpacity onPress={speakFrench} disabled={isLoading}>
      <Text>Speak French</Text>
    </TouchableOpacity>
  );
}
```

## 📚 Lessons Content

The app includes 20 comprehensive lessons covering:

1. **Basic Greetings** - Essential Tahitian salutations
2. **Numbers** - Counting 1-10 in Tahitian
3. **Family** - Family vocabulary
4. **Local Food** - Traditional Polynesian cuisine
5. **Nature** - Natural elements of Tahiti
6. **Politeness** - Respect and courtesy expressions
7. **Colors** - Color vocabulary
8. **Time** - Temporal expressions
9. **Directions** - Navigation in Tahitian
10. **Emotions** - Expressing feelings
11. **Daily Activities** - Common actions
12. **Traditional Clothing** - Polynesian attire
13. **Music & Dance** - Polynesian arts
14. **Marine Animals** - Ocean life vocabulary
15. **Tropical Weather** - Weather conditions
16. **Traditional Festivals** - Polynesian celebrations
17. **Local Crafts** - Traditional arts and crafts
18. **Traditional Navigation** - Polynesian seafaring
19. **Advanced Expressions** - Complex phrases
20. **Polynesian Wisdom** - Proverbs and traditional sayings

## 🔧 Development

### Available Scripts

```bash
npm run start          # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm run check          # Type checking
npm run lint           # ESLint
```

### TTS Server Management

```bash
# Start TTS server (keep running during development)
tts-server --model_name "tts_models/fr/mai/tacotron2-DDC" --port 5002

# Switch to English model
tts-server --model_name "tts_models/en/ljspeech/tacotron2-DDC" --port 5002

# List available models
tts --list_models
```

## 🌐 Deployment

### Production TTS Setup

For production deployment, consider:

1. **Docker Container**: Package Coqui TTS in a Docker container
2. **Cloud Hosting**: Deploy TTS server on cloud platforms
3. **Load Balancing**: Multiple TTS instances for scalability
4. **Caching**: Cache generated audio files

### Example Docker Setup

```dockerfile
FROM python:3.9-slim

RUN pip install TTS

EXPOSE 5002

CMD ["tts-server", "--model_name", "tts_models/fr/mai/tacotron2-DDC", "--port", "5002", "--host", "0.0.0.0"]
```

## 🎨 Customization

### Adding New Languages

1. Update `TTS_MODELS` in `src/types/tts.ts`
2. Add new language option in `TTSLanguage` type
3. Update TTS server configuration
4. Add language-specific lessons

### Adding New Lessons

1. Edit `src/data/lessons.ts`
2. Follow the `Lesson` interface structure
3. Include pronunciation guides
4. Add cultural notes where appropriate

## 🐛 Troubleshooting

### TTS Server Issues

```bash
# Check if server is running
curl http://localhost:5002/health

# Restart TTS server
pkill -f tts-server
tts-server --model_name "tts_models/fr/mai/tacotron2-DDC" --port 5002

# Check available models
tts --list_models | grep -E "(fr|en)"
```

### Common Issues

1. **TTS Server Not Responding**: Ensure Python and TTS are properly installed
2. **Audio Not Playing**: Check device audio settings and permissions
3. **Model Loading Errors**: Verify model names and internet connection for initial download
4. **Port Conflicts**: Change TTS server port if 5002 is occupied

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Submit a pull request

## 🌺 Cultural Note

This app is designed with respect for Polynesian culture and language. The content aims to preserve and share the beauty of Tahitian language and traditions.

---

**Mauruuru** (Thank you) for using Tahiti French Tutor! 🌺