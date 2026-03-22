
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

function getApiKey(): string {
  return localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY || '';
}

function getClient(): GoogleGenAI {
  const key = getApiKey();
  if (!key) {
    throw new Error('Gemini API key not configured. Please enter your API key in Settings.');
  }
  return new GoogleGenAI({ apiKey: key });
}

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
    const ai = getClient();
    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: { parts: [textPart, imagePart] },
    });

    return response;
};

/**
 * Analyzes multiple image frames from a video with a text prompt.
 */
export const analyzeVideoFrames = async (prompt: string, videoFrames: { data: string, mimeType: string }[]): Promise<GenerateContentResponse> => {
    const ai = getClient();
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
        model: 'gemini-2.0-flash',
        contents: { parts },
    });

    return response;
};

/**
 * Performs a query using Google Search grounding.
 */
export const groundedQuery = async (prompt: string): Promise<GenerateContentResponse> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
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
export const summarizeText = async (text: string): Promise<GenerateContentResponse> => {
    const ai = getClient();
    const prompt = `Summarize the following text into a concise paragraph:\n\n---\n${text}\n---`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });
    return response;
};

const MEDIA_EXPERT_SYSTEM_INSTRUCTION = `You are MediaMind, an elite AI media expert with encyclopedic knowledge rivaling IMDb, AllMusic, Metacritic, Rotten Tomatoes, and Wikipedia combined. You are the definitive authority on:

FILM & TELEVISION
- Full cast and crew (directors, producers, cinematographers, composers, editors)
- Plot summaries, themes, motifs, and symbolism
- Production history, behind-the-scenes facts, and trivia
- Box office performance, budgets, and financial analysis
- Awards history (Oscars, Emmys, BAFTAs, Golden Globes, Cannes, etc.)
- Critical reception, audience scores, and cultural impact
- Franchise connections, sequels, prequels, remakes, spin-offs, shared universes
- Streaming availability and distribution history

MUSIC
- Artist discographies, albums, singles, and B-sides
- Chart performance, certifications (gold/platinum/diamond)
- Production credits (producers, engineers, session musicians)
- Genre history, influences, and legacy
- Lyrics themes and musical analysis
- Concert tours and live performance history
- Label history and industry context

ALL MEDIA
- Video games, anime, manga, comics, podcasts, books
- Cross-media adaptations and tie-ins
- Historical and cultural context

RESPONSE STYLE
- Lead with the most important facts
- Use clear sections when answering complex questions
- Include specific dates, names, and numbers — be precise
- Flag anything uncertain rather than guess
- Pull the latest data using web search for current events, recent releases, and box office figures
- Keep responses comprehensive but scannable`;

/**
 * Queries the Gemini model as a media expert with Google Search grounding.
 * Provides encyclopedic knowledge of films, TV, music, and all media.
 */
export const mediaExpertQuery = async (query: string): Promise<GenerateContentResponse> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: query,
        config: {
            systemInstruction: MEDIA_EXPERT_SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
        },
    });
    return response;
};
