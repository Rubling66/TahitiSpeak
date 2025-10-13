// Local AI Configuration
// Manages connection settings for Llama 3.1 DeepSeek local instance

export interface LocalAIConfig {
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

// Default configuration for local Llama 3.1 DeepSeek
export const defaultConfig: LocalAIConfig = {
  endpoint: 'http://localhost:11434', // Default Ollama endpoint
  model: 'deepseek-llama-3.1',
  maxTokens: 2048,
  temperature: 0.7,
  timeout: 30000 // 30 seconds
};

// Load configuration from environment variables
export function getLocalAIConfig(): LocalAIConfig {
  return {
    endpoint: process.env.LOCAL_AI_ENDPOINT || defaultConfig.endpoint,
    model: process.env.LOCAL_AI_MODEL || defaultConfig.model,
    maxTokens: parseInt(process.env.LOCAL_AI_MAX_TOKENS || defaultConfig.maxTokens.toString()),
    temperature: parseFloat(process.env.LOCAL_AI_TEMPERATURE || defaultConfig.temperature.toString()),
    timeout: parseInt(process.env.LOCAL_AI_TIMEOUT || defaultConfig.timeout.toString())
  };
}

// Validate configuration
export function validateConfig(config: LocalAIConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.endpoint) {
    errors.push('LOCAL_AI_ENDPOINT is required');
  }

  if (!config.model) {
    errors.push('LOCAL_AI_MODEL is required');
  }

  if (config.maxTokens <= 0) {
    errors.push('LOCAL_AI_MAX_TOKENS must be greater than 0');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('LOCAL_AI_TEMPERATURE must be between 0 and 2');
  }

  if (config.timeout <= 0) {
    errors.push('LOCAL_AI_TIMEOUT must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default getLocalAIConfig;