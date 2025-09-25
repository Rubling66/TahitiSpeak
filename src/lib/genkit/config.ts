// Local AI configuration - using Llama 3.1 DeepSeek instead of external APIs
import { LocalAIService } from '../local-ai/LocalAIService';

// Get local AI service instance
export const ai = LocalAIService.getInstance();

// No external telemetry needed for local AI
export default ai;