
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from '../types';

const getGeminiClient = () => {
  // CRITICAL: A new GoogleGenAI instance is created right before making an API call
  // to ensure it always uses the most up-to-date API key from the dialog if it were
  // a Veo model. For imagen-4.0-generate-001, this ensures process.env.API_KEY is read.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface GenerateImagesOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  referenceImageBase64?: string; // Full data URL for the image
}

export const generateImages = async (
  options: GenerateImagesOptions,
): Promise<string[]> => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY environment variable is not set. Please provide it.');
  }

  const { prompt, aspectRatio, referenceImageBase64 } = options;
  const ai = getGeminiClient();

  const imagePart = referenceImageBase64 ? {
    image: {
      imageBytes: referenceImageBase64.split(',')[1], // Extract base64 part
      mimeType: 'image/png', // Assume PNG for base64 data URLs
    },
  } : {};

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      ...imagePart, // Conditionally spread imagePart
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/png', // Force PNG for consistent output
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map((img) => {
        const base64ImageBytes: string = img.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
      });
    } else {
      console.error('No images generated:', response);
      throw new Error('Failed to generate images. No images returned from API.');
    }
  } catch (error) {
    console.error('Error generating images:', error);
    if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
      // This error often indicates an invalid API key or model access issue.
      // Although imagen-4.0-generate-001 doesn't use the aistudio key selection dialog,
      // it's a good pattern to include for models that do.
      // For this specific model, it likely means the API key is genuinely bad or not authorized.
      console.error("API Key might be invalid or unauthorized for imagen-4.0-generate-001.");
      throw new Error("Failed to generate images. Please check your API key and ensure it has access to the 'imagen-4.0-generate-001' model. Original error: " + error.message);
    }
    throw new Error(`Failed to generate images: ${(error as Error).message}`);
  }
};
    