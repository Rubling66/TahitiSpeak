# TahitiSpeak Implementation Guide
## Step-by-Step Integration Procedures

## 1. Pre-Integration Setup

### 1.1 Environment Preparation
```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Navigate to project directory
cd "C:\Users\Admin\Desktop\French Tahitian application\tahitian-tutor-web"

# Create backup of current state
git add .
git commit -m "Pre-integration backup"
git tag v1.0.0-pre-integration
```

### 1.2 Testing Framework Setup
```bash
# Install additional testing dependencies
npm install --save-dev @testing-library/jest-dom @testing-library/user-event
npm install --save-dev playwright @playwright/test
npm install --save-dev jest-environment-jsdom

# Install Playwright browsers
npx playwright install
```

### 1.3 Environment Variables Setup
```bash
# Create .env.local file
touch .env.local
```

```env
# .env.local
# TalkingHead Configuration
NEXT_PUBLIC_AVATAR_MODEL_URL=https://models.readyplayer.me/
NEXT_PUBLIC_ENABLE_AVATAR=true

# Firebase Genkit Configuration
GOOGLE_GENAI_API_KEY=your_api_key_here
FIREBASE_PROJECT_ID=tahitispeak-ai
NEXT_PUBLIC_ENABLE_AI=true

# Isograph Configuration
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3000/api/graphql
NEXT_PUBLIC_ENABLE_ISOGRAPH=true

# Feature Flags
NEXT_PUBLIC_INTEGRATION_PHASE=1
```

## 2. Integration 1: TalkingHead Avatar System

### 2.1 Installation Steps

#### Step 1: Install Dependencies
```bash
# Core TalkingHead dependencies
npm install three @types/three
npm install @mediapipe/face_mesh
npm install @mediapipe/camera_utils
npm install @mediapipe/drawing_utils

# Additional WebGL utilities
npm install @types/webgl2
npm install gl-matrix
```

#### Step 2: Create TalkingHead Service
```bash
# Create directory structure
mkdir -p src/services/avatar
mkdir -p src/components/avatar
mkdir -p src/types/avatar
mkdir -p public/models/avatars
```

```typescript
// src/services/avatar/TalkingHeadService.ts
import * as THREE from 'three';
import { FaceMesh } from '@mediapipe/face_mesh';

export interface AvatarConfig {
  modelUrl: string;
  culturalStyle: 'traditional' | 'modern' | 'contemporary';
  gender: 'male' | 'female' | 'neutral';
  ageGroup: 'young' | 'adult' | 'elder';
}

export interface LipSyncData {
  timestamps: number[];
  phonemes: string[];
  intensities: number[];
}

export class TalkingHeadService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private avatar: THREE.Group | null = null;
  private faceMesh: FaceMesh;
  private isInitialized = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.initializeThreeJS();
    this.initializeFaceMesh();
  }

  private initializeThreeJS(): void {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f8ff);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.canvas.width / this.canvas.height,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  private initializeFaceMesh(): void {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  async loadAvatar(config: AvatarConfig): Promise<void> {
    try {
      const loader = new THREE.GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          config.modelUrl,
          resolve,
          undefined,
          reject
        );
      });

      this.avatar = gltf.scene;
      this.avatar.scale.setScalar(1.5);
      this.avatar.position.set(0, -1, 0);
      
      // Apply cultural styling
      this.applyCulturalStyling(config.culturalStyle);
      
      this.scene.add(this.avatar);
      this.isInitialized = true;
      
      console.log('Avatar loaded successfully');
    } catch (error) {
      console.error('Failed to load avatar:', error);
      throw new Error(`Avatar loading failed: ${error.message}`);
    }
  }

  private applyCulturalStyling(style: string): void {
    if (!this.avatar) return;

    switch (style) {
      case 'traditional':
        // Add traditional Tahitian elements
        this.addTraditionalElements();
        break;
      case 'modern':
        // Apply modern styling
        this.addModernElements();
        break;
      case 'contemporary':
        // Blend traditional and modern
        this.addContemporaryElements();
        break;
    }
  }

  private addTraditionalElements(): void {
    // Add traditional Tahitian clothing, jewelry, etc.
    const flowerCrown = this.createFlowerCrown();
    if (flowerCrown && this.avatar) {
      this.avatar.add(flowerCrown);
    }
  }

  private createFlowerCrown(): THREE.Group {
    const crown = new THREE.Group();
    
    // Create hibiscus flowers
    for (let i = 0; i < 8; i++) {
      const flower = this.createHibiscusFlower();
      const angle = (i / 8) * Math.PI * 2;
      flower.position.set(
        Math.cos(angle) * 0.8,
        1.2,
        Math.sin(angle) * 0.8
      );
      crown.add(flower);
    }
    
    return crown;
  }

  private createHibiscusFlower(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.1, 0.05, 8);
    const material = new THREE.MeshLambertMaterial({ color: 0xff6b9d });
    return new THREE.Mesh(geometry, material);
  }

  async speakWithLipSync(audioUrl: string, lipSyncData: LipSyncData): Promise<void> {
    if (!this.isInitialized || !this.avatar) {
      throw new Error('Avatar not initialized');
    }

    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onloadeddata = () => {
        audio.play();
        this.animateLipSync(lipSyncData, audio.duration * 1000);
      };
      
      audio.onended = resolve;
      audio.onerror = reject;
    });
  }

  private animateLipSync(lipSyncData: LipSyncData, duration: number): void {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.resetMouthPosition();
        return;
      }
      
      // Find current phoneme based on timestamp
      const currentIndex = lipSyncData.timestamps.findIndex(
        (timestamp, index) => {
          const nextTimestamp = lipSyncData.timestamps[index + 1];
          return elapsed >= timestamp && (!nextTimestamp || elapsed < nextTimestamp);
        }
      );
      
      if (currentIndex >= 0) {
        const phoneme = lipSyncData.phonemes[currentIndex];
        const intensity = lipSyncData.intensities[currentIndex];
        this.updateMouthShape(phoneme, intensity);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  private updateMouthShape(phoneme: string, intensity: number): void {
    if (!this.avatar) return;
    
    // Find mouth mesh in avatar
    const mouth = this.avatar.getObjectByName('mouth');
    if (!mouth) return;
    
    // Apply phoneme-specific transformations
    switch (phoneme) {
      case 'A':
      case 'a':
        this.setMouthOpenness(0.8 * intensity);
        break;
      case 'E':
      case 'e':
        this.setMouthWidth(0.6 * intensity);
        break;
      case 'I':
      case 'i':
        this.setMouthSmile(0.4 * intensity);
        break;
      case 'O':
      case 'o':
        this.setMouthRound(0.7 * intensity);
        break;
      case 'U':
      case 'u':
        this.setMouthPucker(0.9 * intensity);
        break;
      default:
        this.setMouthNeutral();
    }
  }

  private setMouthOpenness(value: number): void {
    // Implementation for mouth opening animation
  }

  private setMouthWidth(value: number): void {
    // Implementation for mouth width animation
  }

  private setMouthSmile(value: number): void {
    // Implementation for smile animation
  }

  private setMouthRound(value: number): void {
    // Implementation for mouth rounding animation
  }

  private setMouthPucker(value: number): void {
    // Implementation for mouth puckering animation
  }

  private setMouthNeutral(): void {
    // Reset mouth to neutral position
  }

  private resetMouthPosition(): void {
    this.setMouthNeutral();
  }

  render(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.avatar) {
      this.scene.remove(this.avatar);
    }
  }
}
```

#### Step 3: Create Avatar Component
```typescript
// src/components/avatar/TahitianAvatar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { TalkingHeadService, AvatarConfig, LipSyncData } from '../../services/avatar/TalkingHeadService';

interface TahitianAvatarProps {
  config: AvatarConfig;
  onInitialized?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

export const TahitianAvatar: React.FC<TahitianAvatarProps> = ({
  config,
  onInitialized,
  onError,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<TalkingHeadService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeAvatar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        serviceRef.current = new TalkingHeadService(canvasRef.current!);
        await serviceRef.current.loadAvatar(config);
        
        // Start render loop
        const animate = () => {
          if (serviceRef.current) {
            serviceRef.current.render();
            requestAnimationFrame(animate);
          }
        };
        animate();

        setIsLoading(false);
        onInitialized?.();
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        setIsLoading(false);
        onError?.(error);
      }
    };

    initializeAvatar();

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, [config, onInitialized, onError]);

  const speakText = async (audioUrl: string, lipSyncData: LipSyncData) => {
    if (serviceRef.current) {
      try {
        await serviceRef.current.speakWithLipSync(audioUrl, lipSyncData);
      } catch (err) {
        console.error('Speech error:', err);
      }
    }
  };

  // Expose speak function to parent components
  React.useImperativeHandle(ref, () => ({
    speak: speakText
  }));

  if (error) {
    return (
      <div className={`avatar-error ${className}`}>
        <div className="error-message">
          <h3>Avatar Loading Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tahitian-avatar-container ${className}`}>
      {isLoading && (
        <div className="avatar-loading">
          <div className="loading-spinner"></div>
          <p>Loading Tahitian Avatar...</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        className="avatar-canvas"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default TahitianAvatar;
```

#### Step 4: Integration Testing
```typescript
// src/__tests__/avatar/TalkingHeadService.test.ts
import { TalkingHeadService, AvatarConfig } from '../../services/avatar/TalkingHeadService';

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    background: null
  })),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    shadowMap: { enabled: false, type: null }
  })),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
    castShadow: false
  })),
  Color: jest.fn(),
  GLTFLoader: jest.fn(() => ({
    load: jest.fn((url, onLoad) => {
      onLoad({
        scene: {
          scale: { setScalar: jest.fn() },
          position: { set: jest.fn() },
          add: jest.fn()
        }
      });
    })
  })),
  Group: jest.fn(() => ({
    add: jest.fn(),
    position: { set: jest.fn() }
  })),
  ConeGeometry: jest.fn(),
  MeshLambertMaterial: jest.fn(),
  Mesh: jest.fn(),
  PCFSoftShadowMap: 'PCFSoftShadowMap'
}));

// Mock MediaPipe
jest.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: jest.fn(() => ({
    setOptions: jest.fn()
  }))
}));

describe('TalkingHeadService', () => {
  let canvas: HTMLCanvasElement;
  let service: TalkingHeadService;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    service = new TalkingHeadService(canvas);
  });

  afterEach(() => {
    service.dispose();
  });

  test('initializes with canvas', () => {
    expect(service).toBeInstanceOf(TalkingHeadService);
  });

  test('loads avatar with traditional style', async () => {
    const config: AvatarConfig = {
      modelUrl: '/models/tahitian-avatar.glb',
      culturalStyle: 'traditional',
      gender: 'female',
      ageGroup: 'adult'
    };

    await expect(service.loadAvatar(config)).resolves.not.toThrow();
  });

  test('handles lip sync animation', async () => {
    const config: AvatarConfig = {
      modelUrl: '/models/tahitian-avatar.glb',
      culturalStyle: 'traditional',
      gender: 'female',
      ageGroup: 'adult'
    };

    await service.loadAvatar(config);

    const lipSyncData = {
      timestamps: [0, 500, 1000],
      phonemes: ['A', 'E', 'I'],
      intensities: [0.8, 0.6, 0.4]
    };

    // Mock audio
    global.Audio = jest.fn(() => ({
      play: jest.fn(),
      onloadeddata: null,
      onended: null,
      onerror: null,
      duration: 2
    })) as any;

    await expect(
      service.speakWithLipSync('/audio/test.mp3', lipSyncData)
    ).resolves.not.toThrow();
  });
});
```

#### Step 5: E2E Testing
```typescript
// tests/e2e/avatar-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('TalkingHead Avatar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn/pronunciation');
  });

  test('loads avatar successfully', async ({ page }) => {
    // Wait for avatar to load
    await page.waitForSelector('.tahitian-avatar-container');
    
    // Check for loading state
    await expect(page.locator('.avatar-loading')).toBeVisible();
    
    // Wait for avatar to be ready
    await page.waitForSelector('.avatar-canvas', { timeout: 10000 });
    
    // Verify avatar is visible
    await expect(page.locator('.avatar-canvas')).toBeVisible();
    await expect(page.locator('.avatar-loading')).not.toBeVisible();
  });

  test('avatar speaks with lip sync', async ({ page }) => {
    // Wait for avatar to load
    await page.waitForSelector('.avatar-canvas');
    
    // Click speak button
    await page.click('[data-testid="speak-phrase"]');
    
    // Verify audio is playing (check for audio element)
    await page.waitForSelector('audio[src*=".mp3"]');
    
    // Verify lip sync animation (check for mouth movement classes)
    await expect(page.locator('.avatar-mouth')).toHaveClass(/animating/);
    
    // Wait for speech to complete
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio');
      return audio && audio.ended;
    });
    
    // Verify animation stopped
    await expect(page.locator('.avatar-mouth')).not.toHaveClass(/animating/);
  });

  test('handles avatar loading errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/models/**', route => route.abort());
    
    await page.goto('/learn/pronunciation');
    
    // Wait for error state
    await page.waitForSelector('.avatar-error');
    
    // Verify error message is displayed
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message h3')).toContainText('Avatar Loading Error');
    
    // Test retry functionality
    await page.click('button:has-text("Retry")');
  });

  test('cultural styling applies correctly', async ({ page }) => {
    // Test traditional style
    await page.selectOption('[data-testid="cultural-style"]', 'traditional');
    await page.click('[data-testid="apply-style"]');
    
    // Wait for style to apply
    await page.waitForTimeout(1000);
    
    // Verify traditional elements are present
    // This would check for specific visual elements in the 3D scene
    await expect(page.locator('.avatar-canvas')).toBeVisible();
    
    // Test modern style
    await page.selectOption('[data-testid="cultural-style"]', 'modern');
    await page.click('[data-testid="apply-style"]');
    
    await page.waitForTimeout(1000);
    await expect(page.locator('.avatar-canvas')).toBeVisible();
  });
});
```

### 2.2 Verification Checklist

- [ ] TalkingHead service initializes without errors
- [ ] Avatar models load within 5 seconds
- [ ] Lip-sync animation works with audio playback
- [ ] Cultural styling applies correctly
- [ ] Error handling works for failed model loads
- [ ] Performance maintains 30+ FPS during animation
- [ ] Memory usage remains stable during extended use
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

## 3. Integration 2: Firebase Genkit AI Framework

### 3.1 Installation Steps

#### Step 1: Install Genkit Dependencies
```bash
# Install Genkit core and plugins
npm install @genkit-ai/core @genkit-ai/firebase @genkit-ai/googleai
npm install @genkit-ai/dotprompt @genkit-ai/flow

# Install additional AI utilities
npm install openai @google-cloud/text-to-speech
npm install @google-cloud/speech
```

#### Step 2: Initialize Genkit Configuration
```bash
# Create Genkit configuration
npx genkit init
```

```typescript
// genkit.config.ts
import { genkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { dotprompt } from '@genkit-ai/dotprompt';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI(),
    dotprompt()
  ],
  model: 'googleai/gemini-1.5-flash',
  enableTracingAndMetrics: true
});

export default ai;
```

#### Step 3: Create AI Language Service
```typescript
// src/services/ai/AILanguageService.ts
import { ai } from '../../../genkit.config';
import { generate } from '@genkit-ai/ai';
import { defineFlow } from '@genkit-ai/flow';

export interface ConversationRequest {
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  culturalContext: string;
  userLanguage: 'fr' | 'en';
}

export interface ConversationResponse {
  exchanges: ConversationExchange[];
  culturalNotes: string[];
  pronunciationTips: PronunciationTip[];
  vocabulary: VocabularyItem[];
}

export interface ConversationExchange {
  id: string;
  french: string;
  tahitian: string;
  pronunciation: string;
  culturalSignificance?: string;
}

export interface PronunciationTip {
  phoneme: string;
  description: string;
  audioExample?: string;
}

export interface VocabularyItem {
  french: string;
  tahitian: string;
  pronunciation: string;
  culturalContext: string;
}

export const generateConversationFlow = defineFlow(
  {
    name: 'generateConversation',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        culturalContext: { type: 'string' },
        userLanguage: { type: 'string', enum: ['fr', 'en'] }
      },
      required: ['topic', 'level', 'culturalContext', 'userLanguage']
    },
    outputSchema: {
      type: 'object',
      properties: {
        exchanges: { type: 'array' },
        culturalNotes: { type: 'array' },
        pronunciationTips: { type: 'array' },
        vocabulary: { type: 'array' }
      }
    }
  },
  async (request: ConversationRequest): Promise<ConversationResponse> => {
    const prompt = `
      Create a French-Tahitian conversation about "${request.topic}" 
      for ${request.level} learners.
      
      Cultural Context: ${request.culturalContext}
      User Language: ${request.userLanguage}
      
      Requirements:
      - 6-8 conversation exchanges
      - Include pronunciation guides using IPA notation
      - Provide cultural significance for key phrases
      - Include vocabulary with cultural context
      - Add pronunciation tips for difficult sounds
      
      Format as JSON with the following structure:
      {
        "exchanges": [
          {
            "id": "1",
            "french": "Bonjour, comment allez-vous?",
            "tahitian": "Ia ora na, eaha to oe huru?",
            "pronunciation": "[ia ˈora na | eˈaha to oe ˈhuru]",
            "culturalSignificance": "Traditional greeting emphasizing well-being"
          }
        ],
        "culturalNotes": [
          "Tahitian greetings often include inquiries about family and health"
        ],
        "pronunciationTips": [
          {
            "phoneme": "r",
            "description": "Tahitian 'r' is rolled, similar to Spanish"
          }
        ],
        "vocabulary": [
          {
            "french": "bonjour",
            "tahitian": "ia ora na",
            "pronunciation": "[ia ˈora na]",
            "culturalContext": "Universal greeting used throughout the day"
          }
        ]
      }
    `;

    const response = await generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    });

    try {
      return JSON.parse(response.text());
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }
);

export class AILanguageService {
  async generateConversation(request: ConversationRequest): Promise<ConversationResponse> {
    try {
      return await generateConversationFlow(request);
    } catch (error) {
      console.error('Conversation generation failed:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  async providePronunciationFeedback(
    userAudio: Blob,
    targetPhrase: string,
    language: 'fr' | 'ty'
  ): Promise<PronunciationFeedback> {
    // Convert audio to base64 for AI analysis
    const audioBase64 = await this.blobToBase64(userAudio);
    
    const prompt = `
      Analyze the pronunciation accuracy of the following audio recording.
      Target phrase: "${targetPhrase}" in ${language === 'fr' ? 'French' : 'Tahitian'}
      
      Provide feedback in JSON format:
      {
        "accuracy": 0.85,
        "overallFeedback": "Good pronunciation with minor issues",
        "specificFeedback": [
          {
            "word": "word",
            "issue": "description",
            "suggestion": "improvement tip"
          }
        ],
        "culturalNotes": "Cultural pronunciation context"
      }
    `;

    const response = await generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      media: {
        contentType: 'audio/wav',
        data: audioBase64
      },
      config: {
        temperature: 0.3,
        maxOutputTokens: 1000
      }
    });

    return JSON.parse(response.text());
  }

  async generateCulturalInsight(topic: string): Promise<CulturalInsight> {
    const prompt = `
      Provide cultural insight about "${topic}" in Tahitian culture.
      Include historical context, modern relevance, and language learning tips.
      
      Format as JSON:
      {
        "title": "Cultural Insight Title",
        "description": "Detailed description",
        "historicalContext": "Historical background",
        "modernRelevance": "How it applies today",
        "languageTips": "Language learning connections",
        "relatedVocabulary": [
          {
            "french": "word",
            "tahitian": "word",
            "culturalSignificance": "meaning"
          }
        ]
      }
    `;

    const response = await generate({
      model: 'googleai/gemini-1.5-flash',
      prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 1500
      }
    });

    return JSON.parse(response.text());
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export interface PronunciationFeedback {
  accuracy: number;
  overallFeedback: string;
  specificFeedback: {
    word: string;
    issue: string;
    suggestion: string;
  }[];
  culturalNotes: string;
}

export interface CulturalInsight {
  title: string;
  description: string;
  historicalContext: string;
  modernRelevance: string;
  languageTips: string;
  relatedVocabulary: {
    french: string;
    tahitian: string;
    culturalSignificance: string;
  }[];
}
```

#### Step 4: Create AI-Powered Components
```typescript
// src/components/ai/ConversationGenerator.tsx
import React, { useState } from 'react';
import { AILanguageService, ConversationRequest, ConversationResponse } from '../../services/ai/AILanguageService';

interface ConversationGeneratorProps {
  onConversationGenerated: (conversation: ConversationResponse) => void;
}

export const ConversationGenerator: React.FC<ConversationGeneratorProps> = ({
  onConversationGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [request, setRequest] = useState<ConversationRequest>({
    topic: '',
    level: 'beginner',
    culturalContext: '',
    userLanguage: 'fr'
  });
  const [error, setError] = useState<string | null>(null);
  
  const aiService = new AILanguageService();

  const handleGenerate = async () => {
    if (!request.topic.trim()) {
      setError('Please enter a conversation topic');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const conversation = await aiService.generateConversation(request);
      onConversationGenerated(conversation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="conversation-generator">
      <h3>Generate AI Conversation</h3>
      
      <div className="form-group">
        <label htmlFor="topic">Conversation Topic:</label>
        <input
          id="topic"
          type="text"
          value={request.topic}
          onChange={(e) => setRequest({ ...request, topic: e.target.value })}
          placeholder="e.g., Ordering food at a restaurant"
          disabled={isGenerating}
        />
      </div>

      <div className="form-group">
        <label htmlFor="level">Learning Level:</label>
        <select
          id="level"
          value={request.level}
          onChange={(e) => setRequest({ ...request, level: e.target.value as any })}
          disabled={isGenerating}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cultural-context">Cultural Context:</label>
        <textarea
          id="cultural-context"
          value={request.culturalContext}
          onChange={(e) => setRequest({ ...request, culturalContext: e.target.value })}
          placeholder="e.g., Traditional Tahitian hospitality customs"
          disabled={isGenerating}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="user-language">Your Language:</label>
        <select
          id="user-language"
          value={request.userLanguage}
          onChange={(e) => setRequest({ ...request, userLanguage: e.target.value as any })}
          disabled={isGenerating}
        >
          <option value="fr">French</option>
          <option value="en">English</option>
        </select>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !request.topic.trim()}
        className="generate-button"
      >
        {isGenerating ? (
          <>
            <span className="spinner"></span>
            Generating...
          </>
        ) : (
          'Generate Conversation'
        )}
      </button>
    </div>
  );
};
```

#### Step 5: Integration Testing
```typescript
// src/__tests__/ai/AILanguageService.test.ts
import { AILanguageService, ConversationRequest } from '../../services/ai/AILanguageService';

// Mock Genkit
jest.mock('@genkit-ai/ai', () => ({
  generate: jest.fn()
}));

import { generate } from '@genkit-ai/ai';

describe('AILanguageService', () => {
  let service: AILanguageService;
  const mockGenerate = generate as jest.MockedFunction<typeof generate>;

  beforeEach(() => {
    service = new AILanguageService();
    jest.clearAllMocks();
  });

  test('generates conversation successfully', async () => {
    const mockResponse = {
      exchanges: [
        {
          id: '1',
          french: 'Bonjour',
          tahitian: 'Ia ora na',
          pronunciation: '[ia ˈora na]',
          culturalSignificance: 'Traditional greeting'
        }
      ],
      culturalNotes: ['Greetings are important in Tahitian culture'],
      pronunciationTips: [
        {
          phoneme: 'r',
          description: 'Rolled r sound'
        }
      ],
      vocabulary: [
        {
          french: 'bonjour',
          tahitian: 'ia ora na',
          pronunciation: '[ia ˈora na]',
          culturalContext: 'Universal greeting'
        }
      ]
    };

    mockGenerate.mockResolvedValue({
      text: () => JSON.stringify(mockResponse)
    });

    const request: ConversationRequest = {
      topic: 'greetings',
      level: 'beginner',
      culturalContext: 'traditional hospitality',
      userLanguage: 'fr'
    };

    const result = await service.generateConversation(request);

    expect(result).toEqual(mockResponse);
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'googleai/gemini-1.5-flash',
      prompt: expect.stringContaining('greetings')
    }));
  });

  test('handles AI service errors', async () => {
    mockGenerate.mockRejectedValue(new Error('API Error'));

    const request: ConversationRequest = {
      topic: 'greetings',
      level: 'beginner',
      culturalContext: 'traditional hospitality',
      userLanguage: 'fr'
    };

    await expect(service.generateConversation(request))
      .rejects.toThrow('AI service error: API Error');
  });

  test('provides pronunciation feedback', async () => {
    const mockFeedback = {
      accuracy: 0.85,
      overallFeedback: 'Good pronunciation',
      specificFeedback: [
        {
          word: 'ora',
          issue: 'Slight mispronunciation',
          suggestion: 'Emphasize the rolled r'
        }
      ],
      culturalNotes: 'Traditional pronunciation is important'
    };

    mockGenerate.mockResolvedValue({
      text: () => JSON.stringify(mockFeedback)
    });

    const audioBlob = new Blob(['mock audio'], { type: 'audio/wav' });
    const result = await service.providePronunciationFeedback(
      audioBlob,
      'Ia ora na',
      'ty'
    );

    expect(result).toEqual(mockFeedback);
  });
});
```

### 3.2 Verification Checklist

- [ ] Genkit initializes with correct configuration
- [ ] AI conversation generation works within 5 seconds
- [ ] Pronunciation feedback provides accurate analysis
- [ ] Cultural insights are relevant and informative
- [ ] Error handling works for API failures
- [ ] Rate limiting is properly implemented
- [ ] API keys are securely managed
- [ ] Response parsing handles malformed JSON

## 4. Integration 3: Isograph GraphQL Framework

### 4.1 Installation Steps

#### Step 1: Install Isograph Dependencies
```bash
# Install Isograph packages
npm install @isograph/react @isograph/compiler @isograph/babel-plugin

# Install GraphQL dependencies
npm install graphql @graphql-tools/schema @graphql-tools/utils
npm install apollo-server-nextjs graphql-tag
```

#### Step 2: Configure Isograph
```json
// isograph.config.json
{
  "project_root": "./src/components",
  "artifact_directory": "./src/components/__isograph",
  "schema": "./schema.graphql",
  "generated_file_header": "/* eslint-disable */\n/* @generated */",
  "module": "import",
  "include_file_extensions_in_import_statements": true
}
```

```typescript
// tsconfig.json (add to compilerOptions.paths)
{
  "compilerOptions": {
    "paths": {
      "@iso": ["./src/components/__isograph/iso.ts"],
      "@/*": ["./src/*"]
    }
  }
}
```

#### Step 3: Create GraphQL Schema
```graphql
# schema.graphql
type Query {
  lessons(filters: LessonFilters): [Lesson!]!
  lesson(id: ID!): Lesson
  userProgress(userId: ID!): UserProgress
  culturalContent(topic: String!): [CulturalContent!]!
  vocabulary(level: Level!): [VocabularyItem!]!
}

type Mutation {
  updateProgress(input: ProgressUpdateInput!): UserProgress!
  saveUserPreferences(input: UserPreferencesInput!): User!
  recordPronunciationAttempt(input: PronunciationAttemptInput!): PronunciationResult!
}

input LessonFilters {
  level: Level
  topic: String
  language: Language
  culturalTheme: String
}

type Lesson {
  id: ID!
  title: String!
  description: String!
  level: Level!
  estimatedDuration: Int!
  content: LessonContent!
  exercises: [Exercise!]!
  culturalContext: CulturalContext
  audioFiles: [AudioFile!]!
  prerequisites: [Lesson!]!
  nextLessons: [Lesson!]!
  userProgress: LessonProgress
}

type LessonContent {
  introduction: String!
  frenchText: String!
  tahitianText: String!
  pronunciation: PronunciationGuide!
  vocabulary: [VocabularyItem!]!
  culturalNotes: [String!]!
  grammarPoints: [GrammarPoint!]!
}

type Exercise {
  id: ID!
  type: ExerciseType!
  title: String!
  instructions: String!
  question: String!
  options: [String!]
  correctAnswer: String!
  explanation: String
  audioPrompt: AudioFile
  culturalContext: String
  difficulty: Int!
}

type UserProgress {
  id: ID!
  user: User!
  completedLessons: [LessonProgress!]!
  currentLevel: Level!
  totalStudyTime: Int!
  streakDays: Int!
  strengths: [String!]!
  weaknesses: [String!]!
  culturalKnowledge: CulturalKnowledgeLevel!
  achievements: [Achievement!]!
  lastActivity: String!
}

type LessonProgress {
  lesson: Lesson!
  completedAt: String!
  score: Float!
  timeSpent: Int!
  exerciseResults: [ExerciseResult!]!
  pronunciationScores: [PronunciationScore!]!
}

type CulturalContent {
  id: ID!
  title: String!
  description: String!
  category: CulturalCategory!
  content: String!
  images: [String!]!
  audioNarration: AudioFile
  relatedVocabulary: [VocabularyItem!]!
  historicalContext: String!
  modernRelevance: String!
}

type VocabularyItem {
  id: ID!
  french: String!
  tahitian: String!
  pronunciation: String!
  partOfSpeech: PartOfSpeech!
  definition: String!
  culturalContext: String!
  examples: [Example!]!
  audioFiles: [AudioFile!]!
  difficulty: Int!
  frequency: Int!
}

type AudioFile {
  id: ID!
  url: String!
  duration: Float!
  speaker: Speaker!
  quality: AudioQuality!
  transcript: String
}

type Speaker {
  id: ID!
  name: String!
  nativeLanguage: Language!
  region: String!
  gender: Gender!
  ageGroup: AgeGroup!
}

type User {
  id: ID!
  email: String!
  name: String!
  preferences: UserPreferences!
  subscription: Subscription!
  createdAt: String!
}

type UserPreferences {
  learningGoals: [LearningGoal!]!
  studyReminders: Boolean!
  culturalFocus: [CulturalTheme!]!
  difficultyPreference: DifficultyPreference!
  audioSpeed: Float!
}

enum Level {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  NATIVE
}

enum Language {
  FRENCH
  TAHITIAN
  ENGLISH
}

enum ExerciseType {
  MULTIPLE_CHOICE
  FILL_IN_BLANK
  PRONUNCIATION
  LISTENING
  TRANSLATION
  CULTURAL_CONTEXT
}

enum CulturalCategory {
  TRADITIONS
  FOOD
  MUSIC
  DANCE
  HISTORY
  MODERN_LIFE
  FAMILY
  NATURE
}

enum PartOfSpeech {
  NOUN
  VERB
  ADJECTIVE
  ADVERB
  PREPOSITION
  CONJUNCTION
  INTERJECTION
}

enum AudioQuality {
  LOW
  MEDIUM
  HIGH
  STUDIO
}

enum Gender {
  MALE
  FEMALE
  NON_BINARY
}

enum AgeGroup {
  CHILD
  YOUNG_ADULT
  ADULT
  ELDER
}

enum LearningGoal {
  CONVERSATION
  TRAVEL
  CULTURAL_UNDERSTANDING
  ACADEMIC
  BUSINESS
  FAMILY_HERITAGE
}

enum CulturalTheme {
  TRADITIONAL
  CONTEMPORARY
  HISTORICAL
  SPIRITUAL
  ARTISTIC
}

enum DifficultyPreference {
  GRADUAL
  CHALLENGING
  ADAPTIVE
}

enum CulturalKnowledgeLevel {
  BASIC
  INTERMEDIATE
  ADVANCED
  EXPERT
}

type PronunciationGuide {
  ipa: String!
  simplified: String!
  audioExample: AudioFile!
  tips: [String!]!
}

type GrammarPoint {
  id: ID!
  title: String!
  explanation: String!
  examples: [Example!]!
  exercises: [Exercise!]!
}

type Example {
  id: ID!
  french: String!
  tahitian: String!
  pronunciation: String!
  context: String!
  audioFile: AudioFile
}

type ExerciseResult {
  exercise: Exercise!
  userAnswer: String!
  isCorrect: Boolean!
  timeSpent: Int!
  attempts: Int!
}

type PronunciationScore {
  word: String!
  accuracy: Float!
  feedback: String!
  audioRecording: String!
}

type Achievement {
  id: ID!
  title: String!
  description: String!
  icon: String!
  unlockedAt: String!
  category: AchievementCategory!
}

enum AchievementCategory {
  LEARNING_STREAK
  PRONUNCIATION
  CULTURAL_KNOWLEDGE
  LESSON_COMPLETION
  SOCIAL
}

type Subscription {
  id: ID!
  plan: SubscriptionPlan!
  status: SubscriptionStatus!
  startDate: String!
  endDate: String
  features: [SubscriptionFeature!]!
}

enum SubscriptionPlan {
  FREE
  PREMIUM
  FAMILY
  EDUCATOR
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  TRIAL
}

enum SubscriptionFeature {
  UNLIMITED_LESSONS
  OFFLINE_ACCESS
  CULTURAL_CONTENT
  PRONUNCIATION_FEEDBACK
  PROGRESS_ANALYTICS
  FAMILY_SHARING
}

input ProgressUpdateInput {
  userId: ID!
  lessonId: ID!
  score: Float!
  timeSpent: Int!
  exerciseResults: [ExerciseResultInput!]!
}

input ExerciseResultInput {
  exerciseId: ID!
  userAnswer: String!
  isCorrect: Boolean!
  timeSpent: Int!
  attempts: Int!
}

input UserPreferencesInput {
  userId: ID!
  learningGoals: [LearningGoal!]
  studyReminders: Boolean
  culturalFocus: [CulturalTheme!]
  difficultyPreference: DifficultyPreference
  audioSpeed: Float
}

input PronunciationAttemptInput {
  userId: ID!
  lessonId: ID!
  word: String!
  audioRecording: String!
}

type PronunciationResult {
  accuracy: Float!
  feedback: String!
  suggestions: [String!]!
  culturalNotes: String
}
```

#### Step 4: Create Isograph Components
```typescript
// src/components/lessons/LessonList.tsx
import { iso } from '@iso';
import React from 'react';

export const LessonList = iso(`
  field Query.LessonList @component {
    lessons(filters: $filters) {
      id
      title
      level
      estimatedDuration
      LessonCard
    }
  }
`)(function LessonListComponent({ data }) {
  return (
    <div className="lesson-list">
      <h2>Available Lessons</h2>
      <div className="lesson-grid">
        {data.lessons.map(lesson => (
          <lesson.LessonCard key={lesson.id} />
        ))}
      </div>
    </div>
  );
});

export const LessonCard = iso(`
  field Lesson.LessonCard @component {
    id
    title
    description
    level
    estimatedDuration
    culturalContext {
      summary
      themes
    }
    userProgress {
      score
      completedAt
    }
  }
`)(function LessonCardComponent({ data }) {
  const isCompleted = !!data.userProgress?.completedAt;
  const score = data.userProgress?.score || 0;

  return (
    <div className={`lesson-card ${isCompleted ? 'completed' : ''}`}>
      <div className="lesson-header">
        <h3>{data.title}</h3>
        <span className={`level-badge level-${data.level.toLowerCase()}`}>
          {data.level}
        </span>
      </div>
      
      <p className="lesson-description">{data.description}</p>
      
      <div className="lesson-meta">
        <span className="duration">
          ⏱️ {data.estimatedDuration} min
        </span>
        {isCompleted && (
          <span className="score">
            ⭐ {Math.round(score * 100)}%
          </span>
        )}
      </div>
      
      {data.culturalContext && (
        <div className="cultural-context">
          <span className="cultural-icon">🌺</span>
          <p>{data.culturalContext.summary}</p>
        </div>
      )}
      
      <div className="lesson-actions">
        <button 
          className={`lesson-button ${isCompleted ? 'review' : 'start'}`}
          onClick={() => window.location.href = `/lessons/${data.id}`}
        >
          {isCompleted ? 'Review' : 'Start Lesson'}
        </button>
      </div>
    </div>
  );
});
```

```typescript
// src/components/lessons/LessonDetail.tsx
import { iso } from '@iso';
import { useLazyReference, useResult } from '@isograph/react';
import React from 'react';

export default function LessonDetailRoute({ lessonId }: { lessonId: string }) {
  const { fragmentReference } = useLazyReference(
    iso(`entrypoint Query.LessonDetail`),
    { lessonId }
  );

  const LessonDetail = useResult(fragmentReference);
  return <LessonDetail />;
}

export const LessonDetail = iso(`
  field Query.LessonDetail @component {
    lesson(id: $lessonId) {
      id
      title
      description
      level
      LessonContent
      ExerciseList
      CulturalContext
      ProgressTracker
    }
  }
`)(function LessonDetailComponent({ data }) {
  if (!data.lesson) {
    return (
      <div className="lesson-not-found">
        <h2>Lesson Not Found</h2>
        <p>The requested lesson could not be found.</p>
      </div>
    );
  }

  return (
    <div className="lesson-detail">
      <div className="lesson-header">
        <h1>{data.lesson.title}</h1>
        <span className={`level-badge level-${data.lesson.level.toLowerCase()}`}>
          {data.lesson.level}
        </span>
      </div>
      
      <p className="lesson-description">{data.lesson.description}</p>
      
      <div className="lesson-sections">
        <data.lesson.LessonContent />
        <data.lesson.CulturalContext />
        <data.lesson.ExerciseList />
        <data.lesson.ProgressTracker />
      </div>
    </div>
  );
});

export const LessonContent = iso(`
  field Lesson.LessonContent @component {
    content {
      introduction
      frenchText
      tahitianText
      pronunciation {
        ipa
        simplified
        AudioPlayer
      }
      VocabularyList
    }
  }
`)(function LessonContentComponent({ data }) {
  return (
    <div className="lesson-content">
      <section className="introduction">
        <h3>Introduction</h3>
        <p>{data.content.introduction}</p>
      </section>
      
      <section className="text-content">
        <div className="text-pair">
          <div className="french-text">
            <h4>Français</h4>
            <p>{data.content.frenchText}</p>
          </div>
          <div className="tahitian-text">
            <h4>Reo Tahiti</h4>
            <p>{data.content.tahitianText}</p>
          </div>
        </div>
        
        <div className="pronunciation">
          <h4>Pronunciation</h4>
          <div className="pronunciation-guides">
            <span className="ipa">IPA: {data.content.pronunciation.ipa}</span>
            <span className="simplified">Simplified: {data.content.pronunciation.simplified}</span>
          </div>
          <data.content.pronunciation.AudioPlayer />
        </div>
      </section>
      
      <data.content.VocabularyList />
    </div>
  );
});

export const VocabularyList = iso(`
  field LessonContent.VocabularyList @component {
    vocabulary {
      id
      french
      tahitian
      pronunciation
      definition
      culturalContext
      VocabularyCard
    }
  }
`)(function VocabularyListComponent({ data }) {
  return (
    <section className="vocabulary-section">
      <h3>Vocabulary</h3>
      <div className="vocabulary-grid">
        {data.vocabulary.map(item => (
          <item.VocabularyCard key={item.id} />
        ))}
      </div>
    </section>
  );
});

export const VocabularyCard = iso(`
  field VocabularyItem.VocabularyCard @component {
    french
    tahitian
    pronunciation
    definition
    culturalContext
    audioFiles {
      AudioPlayer
    }
  }
`)(function VocabularyCardComponent({ data }) {
  return (
    <div className="vocabulary-card">
      <div className="word-pair">
        <span className="french">{data.french}</span>
        <span className="tahitian">{data.tahitian}</span>
      </div>
      <div className="pronunciation">[{data.pronunciation}]</div>
      <p className="definition">{data.definition}</p>
      {data.culturalContext && (
        <div className="cultural-note">
          <span className="cultural-icon">🌺</span>
          <p>{data.culturalContext}</p>
        </div>
      )}
      {data.audioFiles[0] && <data.audioFiles[0].AudioPlayer />}
    </div>
  );
});
```

#### Step 5: Create GraphQL Resolvers
```typescript
// src/api/graphql/resolvers.ts
import { Resolvers } from './generated/types';
import { Context } from './context';

export const resolvers: Resolvers<Context> = {
  Query: {
    lessons: async (_, { filters }, { dataSources }) => {
      return await dataSources.lessonAPI.getLessons(filters);
    },
    lesson: async (_, { id }, { dataSources }) => {
      return await dataSources.lessonAPI.getLesson(id);
    },
    userProgress: async (_, { userId }, { dataSources }) => {
      return await dataSources.progressAPI.getUserProgress(userId);
    },
    culturalContent: async (_, { topic }, { dataSources }) => {
      return await dataSources.culturalAPI.getContentByTopic(topic);
    },
    vocabulary: async (_, { level }, { dataSources }) => {
      return await dataSources.vocabularyAPI.getVocabularyByLevel(level);
    }
  },
  
  Mutation: {
    updateProgress: async (_, { input }, { dataSources, user }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.progressAPI.updateProgress(input);
    },
    saveUserPreferences: async (_, { input }, { dataSources, user }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.userAPI.updatePreferences(input);
    },
    recordPronunciationAttempt: async (_, { input }, { dataSources, user }) => {
      if (!user) throw new Error('Authentication required');
      return await dataSources.pronunciationAPI.recordAttempt(input);
    }
  },
  
  Lesson: {
    userProgress: async (lesson, _, { dataSources, user }) => {
      if (!user) return null;
      return await dataSources.progressAPI.getLessonProgress(user.id, lesson.id);
    },
    prerequisites: async (lesson, _, { dataSources }) => {
      return await dataSources.lessonAPI.getPrerequisites(lesson.id);
    },
    nextLessons: async (lesson, _, { dataSources }) => {
      return await dataSources.lessonAPI.getNextLessons(lesson.id);
    }
  }
};
```

#### Step 6: Integration Testing
```typescript
// src/__tests__/graphql/isograph-integration.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { IsographEnvironmentProvider } from '@isograph/react';
import { LessonList } from '../../components/lessons/LessonList';
import { createMockEnvironment } from '@isograph/react/testing';

describe('Isograph Integration', () => {
  let mockEnvironment: any;

  beforeEach(() => {
    mockEnvironment = createMockEnvironment();
  });

  test('renders lesson list with data', async () => {
    const mockLessons = [
      {
        id: '1',
        title: 'Basic Greetings',
        level: 'BEGINNER',
        estimatedDuration: 15,
        description: 'Learn basic Tahitian greetings'
      },
      {
        id: '2',
        title: 'Family Terms',
        level: 'BEGINNER',
        estimatedDuration: 20,
        description: 'Family vocabulary in Tahitian'
      }
    ];

    mockEnvironment.mock.queueOperationResolver(() => ({
      lessons: mockLessons
    }));

    render(
      <IsographEnvironmentProvider environment={mockEnvironment}>
        <LessonList filters={{ level: 'BEGINNER' }} />
      </IsographEnvironmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
      expect(screen.getByText('Family Terms')).toBeInTheDocument();
    });

    expect(screen.getByText('Available Lessons')).toBeInTheDocument();
  });

  test('handles loading states', async () => {
    render(
      <IsographEnvironmentProvider environment={mockEnvironment}>
        <LessonList filters={{ level: 'BEGINNER' }} />
      </IsographEnvironmentProvider>
    );

    // Should show loading state initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Mock the response
    mockEnvironment.mock.queueOperationResolver(() => ({
      lessons: []
    }));

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  test('handles GraphQL errors', async () => {
    mockEnvironment.mock.queueOperationResolver(() => {
      throw new Error('GraphQL Error: Failed to fetch lessons');
    });

    render(
      <IsographEnvironmentProvider environment={mockEnvironment}>
        <LessonList filters={{ level: 'BEGINNER' }} />
      </IsographEnvironmentProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error loading lessons/)).toBeInTheDocument();
    });
  });
});
```

### 4.2 Verification Checklist

- [ ] Isograph compiler generates correct artifacts
- [ ] GraphQL schema validates successfully
- [ ] Components render with proper data fetching
- [ ] Loading states work correctly
- [ ] Error handling displays appropriate messages
- [ ] Data masking prevents over-fetching
- [ ] Performance optimizations are active
- [ ] Type safety is maintained throughout

## 5. Integration Testing Framework

### 5.1 Comprehensive Test Suite
```typescript
// tests/integration/full-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Full Integration Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete learning flow with all integrations', async ({ page }) => {
    // 1. Navigate to lesson
    await page.click('[data-testid="start-learning"]');
    await page.waitForSelector('.lesson-list');
    
    // 2. Select a lesson
    await page.click('.lesson-card:first-child .lesson-button');
    await page.waitForSelector('.lesson-detail');
    
    // 3. Verify TalkingHead avatar loads
    await page.waitForSelector('.tahitian-avatar-container');
    await expect(page.locator('.avatar-canvas')).toBeVisible();
    
    // 4. Test AI conversation generation
    await page.click('[data-testid="generate-conversation"]');
    await page.fill('#topic', 'ordering food');
    await page.click('.generate-button');
    
    await page.waitForSelector('.conversation-result');
    await expect(page.locator('.conversation-exchange')).toHaveCount(6, { timeout: 10000 });
    
    // 5. Test pronunciation with avatar
    await page.click('[data-testid="practice-pronunciation"]');
    await page.click('[data-testid="record-button"]');
    
    // Simulate recording
    await page.waitForTimeout(2000);
    await page.click('[data-testid="stop-recording"]');
    
    // Verify AI feedback
    await page.waitForSelector('.pronunciation-feedback');
    await expect(page.locator('.accuracy-score')).toBeVisible();
    
    // 6. Verify GraphQL data updates
    await page.waitForSelector('[data-testid="progress-updated"]');
    
    // 7. Complete lesson
    await page.click('[data-testid="complete-lesson"]');
    await expect(page.locator('.lesson-completed')).toBeVisible();
  });

  test('performance benchmarks', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to lesson with all integrations
    await page.goto('/lessons/1');
    
    // Wait for all components to load
    await page.waitForSelector('.avatar-canvas');
    await page.waitForSelector('.lesson-content');
    await page.waitForSelector('.vocabulary-grid');
    
    const loadTime = Date.now() - startTime;
    
    // Verify performance targets
    expect(loadTime).toBeLessThan(5000); // 5 second max load time
    
    // Check memory usage
    const metrics = await page.evaluate(() => {
      return {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        timing: performance.timing
      };
    });
    
    // Memory should be reasonable (less than 100MB)
    expect(metrics.memory).toBeLessThan(100 * 1024 * 1024);
  });

  test('error recovery and fallbacks', async ({ page }) => {
    // Test avatar loading failure
    await page.route('**/models/**', route => route.abort());
    await page.goto('/lessons/1');
    
    await page.waitForSelector('.avatar-error');
    await expect(page.locator('.error-message')).toBeVisible();
    
    // Test AI service failure
    await page.route('**/api/ai/**', route => route.abort());
    await page.click('[data-testid="generate-conversation"]');
    
    await page.waitForSelector('.ai-error');
    await expect(page.locator('.fallback-content')).toBeVisible();
    
    // Test GraphQL failure
    await page.route('**/api/graphql', route => route.abort());
    await page.reload();
    
    await page.waitForSelector('.graphql-error');
    await expect(page.locator('.offline-mode')).toBeVisible();
  });
});
```

### 5.2 Performance Monitoring
```typescript
// src/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${label} took ${duration}ms`);
      }
    };
  }
  
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  getReport(): Record<string, { average: number; count: number; max: number }> {
    const report: Record<string, { average: number; count: number; max: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      report[label] = {
        average: this.getAverageTime(label),
        count: times.length,
        max: Math.max(...times)
      };
    }
    
    return report;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

## 6. Deployment and Monitoring

### 6.1 Environment Configuration
```bash
# Production environment setup
# .env.production
NEXT_PUBLIC_AVATAR_MODEL_URL=https://cdn.tahitispeak.com/models/
NEXT_PUBLIC_ENABLE_AVATAR=true

GOOGLE_GENAI_API_KEY=prod_api_key_here
FIREBASE_PROJECT_ID=tahitispeak-prod
NEXT_PUBLIC_ENABLE_AI=true

NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.tahitispeak.com/graphql
NEXT_PUBLIC_ENABLE_ISOGRAPH=true

NEXT_PUBLIC_INTEGRATION_PHASE=3
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
```

### 6.2 Health Checks
```typescript
// src/api/health/route.ts
import { NextResponse } from 'next/server';
import { TalkingHeadService } from '../../services/avatar/TalkingHeadService';
import { AILanguageService } from '../../services/ai/AILanguageService';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    integrations: {
      avatar: 'unknown',
      ai: 'unknown',
      graphql: 'unknown'
    },
    performance: {
      responseTime: 0,
      memoryUsage: process.memoryUsage()
    }
  };

  const startTime = Date.now();

  try {
    // Test Avatar Service
    const canvas = new OffscreenCanvas(512, 512);
    const avatarService = new TalkingHeadService(canvas as any);
    health.integrations.avatar = 'healthy';
  } catch (error) {
    health.integrations.avatar = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Test AI Service
    const aiService = new AILanguageService();
    health.integrations.ai = 'healthy';
  } catch (error) {
    health.integrations.ai = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Test GraphQL endpoint
    const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' })
    });
    
    if (response.ok) {
      health.integrations.graphql = 'healthy';
    } else {
      health.integrations.graphql = 'unhealthy';
      health.status = 'degraded';
    }
  } catch (error) {
    health.integrations.graphql = 'unhealthy';
    health.status = 'degraded';
  }

  health.performance.responseTime = Date.now() - startTime;

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503
  });
}
```

## 7. Maintenance and Updates

### 7.1 Update Procedures
```bash
# Weekly maintenance script
#!/bin/bash

# Update dependencies
npm audit fix
npm update

# Run full test suite
npm run test:integration
npm run test:e2e

# Performance benchmarks
npm run test:performance

# Security scan
npm audit

# Build verification
npm run build

echo "Maintenance completed successfully"
```

### 7.2 Monitoring Dashboard
```typescript
// src/components/admin/IntegrationDashboard.tsx
import React, { useEffect, useState } from 'react';
import { performanceMonitor } from '../../utils/performance-monitor';

export const IntegrationDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthStatus(data);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      }
    };

    const updatePerformanceData = () => {
      setPerformanceData(performanceMonitor.getReport());
    };

    fetchHealthStatus();
    updatePerformanceData();

    const interval = setInterval(() => {
      fetchHealthStatus();
      updatePerformanceData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!healthStatus) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="integration-dashboard">
      <h2>Integration Status Dashboard</h2>
      
      <div className="status-grid">
        <div className={`status-card ${healthStatus.integrations.avatar}`}>
          <h3>TalkingHead Avatar</h3>
          <span className="status">{healthStatus.integrations.avatar}</span>
        </div>
        
        <div className={`status-card ${healthStatus.integrations.ai}`}>
          <h3>Firebase Genkit AI</h3>
          <span className="status">{healthStatus.integrations.ai}</span>
        </div>
        
        <div className={`status-card ${healthStatus.integrations.graphql}`}>
          <h3>Isograph GraphQL</h3>
          <span className="status">{healthStatus.integrations.graphql}</span>
        </div>
      </div>
      
      {performanceData && (
        <div className="performance-section">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            {Object.entries(performanceData).map(([label, data]: [string, any]) => (
              <div key={label} className="metric-card">
                <h4>{label}</h4>
                <p>Average: {data.average.toFixed(2)}ms</p>
                <p>Max: {data.max.toFixed(2)}ms</p>
                <p>Count: {data.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## 8. Final Integration Checklist

### 8.1 Pre-Production Verification
- [ ] All three integrations pass individual tests
- [ ] Cross-integration functionality works correctly
- [ ] Performance meets benchmarks (< 5s load time)
- [ ] Error handling and fallbacks are functional
- [ ] Security configurations are properly set
- [ ] Environment variables are configured
- [ ] Health monitoring is operational
- [ ] Documentation is complete and accurate

### 8.2 Go-Live Procedure
1. **Backup current system**
2. **Deploy to staging environment**
3. **Run full integration test suite**
4. **Performance validation**
5. **Security audit**
6. **Deploy to production**
7. **Monitor for 24 hours**
8. **User acceptance testing**

### 8.3 Success Metrics
- Avatar loading success rate > 95%
- AI response time < 3 seconds
- GraphQL query performance < 500ms
- User engagement increase > 20%
- Error rate < 1%
- System uptime > 99.5%

This comprehensive implementation guide provides step-by-step procedures for integrating all three technologies into the TahitiSpeak application, ensuring robust testing, monitoring, and maintenance procedures are in place.