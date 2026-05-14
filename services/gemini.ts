
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Helper Functions ---

/**
 * Converts a File object to a base64 encoded string without the data URI prefix.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};


// --- Gemini API Calls ---

/**
 * Analyzes a single image with a text prompt.
 */
export const analyzeImage = async (prompt: string, imageFile: File): Promise<GenerateContentResponse> => {
    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [textPart, imagePart] },
    });

    return response;
};

/**
 * Analyzes multiple image frames from a video with a text prompt.
 */
export const analyzeVideoFrames = async (prompt: string, videoFrames: { data: string, mimeType: string }[]): Promise<GenerateContentResponse> => {
    const textPart = { text: prompt };
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            data: frame.data.split(',')[1], // remove data URI prefix
            mimeType: frame.mimeType
        }
    }));
    
    // The prompt text should be the first part
    const parts = [textPart, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
    });

    return response;
};

/**
 * Performs a query using Google Search grounding.
 */
export const groundedQuery = async (prompt: string): Promise<GenerateContentResponse> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return response;
};

/**
 * Summarizes a given block of text.
 */
/**
 * Analyzes video frames to extract structured metadata like title, plot, actors, and genre.
 */
export const enrichVideoMetadata = async (videoFrames: { data: string, mimeType: string }[]): Promise<GenerateContentResponse> => {
    const prompt = `Analyze the following video frames. If this is a known movie, TV show, or commercial, identify it and provide its title, a brief plot summary, main actors, and genre. If it's user-generated content, provide a descriptive title, a summary of the action, and suggest relevant genres/tags.`;

    const textPart = { text: prompt };
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            data: frame.data.split(',')[1], // remove data URI prefix
            mimeType: frame.mimeType
        }
    }));

    const parts = [textPart, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    plot: { type: Type.STRING },
                    actors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    genre: { type: Type.STRING },
                }
            }
        }
    });

    return response;
};

/**
 * Summarizes a given block of text.
 */
export const summarizeText = async (text: string): Promise<GenerateContentResponse> => {
    const prompt = `Summarize the following text into a concise paragraph:\n\n---\n${text}\n---`;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return response;
};
