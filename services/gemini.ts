import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

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
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
    });

    return response;
};

export const analyzeVideoFrames = async (prompt: string, videoFrames: { data: string, mimeType: string }[]): Promise<GenerateContentResponse> => {
    const textPart = { text: prompt };
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            data: frame.data.split(',')[1],
            mimeType: frame.mimeType
        }
    }));

    const parts = [textPart, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
    });

    return response;
};

export const groundedQuery = async (prompt: string): Promise<GenerateContentResponse> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    return response;
};

export const enrichVideoMetadata = async (videoFrames: { data: string, mimeType: string }[]): Promise<GenerateContentResponse> => {
    const prompt = `Analyze the following video frames. Utilize your internal knowledge of movie, TV show, and tech databases (like TMDb, IMDb, TVDB) to help identify this content. 
    If this is a known movie, TV show, or commercial, provide its title, a brief plot summary, main actors, and genre. 
    If it's user-generated content, provide a descriptive title, a summary of the action, and suggest relevant genres/tags.
    Focus on creating high-quality, rich metadata.`;

    const textPart = { text: prompt };
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            data: frame.data.split(',')[1],
            mimeType: frame.mimeType
        }
    }));

    const parts = [textPart, ...imageParts];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

export const summarizeText = async (text: string): Promise<GenerateContentResponse> => {
    const prompt = `Summarize the following text into a concise paragraph:\n\n---\n${text}\n---`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response;
};
