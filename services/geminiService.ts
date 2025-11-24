import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Export modifiers so App can use them to spawn diverse requests
export const STYLE_MODIFIERS = [
  " (ensure high fidelity to prompt)", 
  " (artistic style, expressive brushwork, vibrant colors)",
  " (cinematic lighting, photorealistic, 8k resolution, dramatic angle)",
  " (minimalist, clean composition, soft lighting, modern aesthetic)",
  " (highly detailed, intricate textures, concept art style)"
];

/**
 * Generates a single image based on the prompt and optional reference.
 * Used by the App to fire multiple parallel requests.
 */
export const generateSingleImage = async (prompt: string, referenceImageBase64?: string, styleModifier: string = ""): Promise<string | null> => {
  const ai = getClient();
  const model = 'gemini-2.5-flash-image'; 

  const parts: any[] = [];
  // Append style modifier to prompt for variety
  const modifiedPrompt = prompt + styleModifier;

  if (referenceImageBase64) {
    parts.push({
      inlineData: {
        data: referenceImageBase64,
        mimeType: 'image/png',
      },
    });
    // For image-to-image, the prompt guides the transformation
    parts.push({ text: modifiedPrompt || "Generate a high quality variation" });
  } else {
    parts.push({ text: modifiedPrompt });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        generationConfig: {
           temperature: 1.1, // Slightly higher temperature for creativity
        }
      }
    });

    const imageParts = response.candidates?.[0]?.content?.parts?.filter(p => p.inlineData);
    if (imageParts && imageParts.length > 0) {
      return `data:image/png;base64,${imageParts[0].inlineData.data}`;
    }
    return null;
  } catch (e) {
    console.error("Gemini API Error:", e);
    return null;
  }
};
