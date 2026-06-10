import { generateImage as generateGeminiImage } from './gemini-image.js';
import { generateOpenAIImage } from './openai-image.js';
import type { ImageGenInput, ImageGenResult } from './gemini-image.js';

const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || 'gemini').toLowerCase();

export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  if (IMAGE_PROVIDER === 'openai' || IMAGE_PROVIDER === 'chatgpt') {
    return generateOpenAIImage(input);
  }
  return generateGeminiImage(input);
}
