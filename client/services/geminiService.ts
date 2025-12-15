import { GoogleGenAI } from "@google/genai";
import { ImageGenerationConfig } from "../types";

export const ensureApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
      return await win.aistudio.hasSelectedApiKey();
    }
    return true;
  }
  return false;
};

export const generateMarketingImage = async (config: ImageGenerationConfig): Promise<string> => {
  // Ensure we have an API key selected for the high-end model
  await ensureApiKey();

  // Create instance right before call to ensure latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: config.prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.size, 
        },
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};