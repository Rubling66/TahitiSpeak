import { genkit } from 'genkit';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';

// Configure Genkit with Google AI
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    }),
  ],
});

// Enable Firebase telemetry if needed
if (process.env.NODE_ENV === 'production') {
  enableFirebaseTelemetry({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export default ai;