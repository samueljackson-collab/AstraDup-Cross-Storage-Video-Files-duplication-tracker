import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the @google/genai (0.14.0) SDK surface used by services/gemini.ts:
//   import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
//   const ai = new GoogleGenAI({ apiKey: ... });
//   ai.models.generateContent({ model, contents, config })
const generateContentMock = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn().mockImplementation(() => ({
            models: {
                generateContent: generateContentMock,
            },
        })),
        Type: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            ARRAY: 'ARRAY',
            NUMBER: 'NUMBER',
        },
    };
});

import { GoogleGenAI } from '@google/genai';
import {
    fileToBase64,
    analyzeImage,
    analyzeVideoFrames,
    groundedQuery,
    enrichVideoMetadata,
    summarizeText,
} from '../../../services/gemini';

describe('services/gemini', () => {
    beforeEach(() => {
        generateContentMock.mockReset();
    });

    describe('fileToBase64', () => {
        it('converts a File to a base64 string without the data URI prefix', async () => {
            const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });

            const result = await fileToBase64(file);

            expect(typeof result).toBe('string');
            // Should not contain the "data:...;base64," prefix.
            expect(result.startsWith('data:')).toBe(false);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('analyzeImage', () => {
        it('calls the SDK with the prompt and image inline data using the configured model', async () => {
            const fakeResponse = { text: 'analysis result' };
            generateContentMock.mockResolvedValue(fakeResponse);

            const imageFile = new File(['imgdata'], 'photo.png', { type: 'image/png' });
            const prompt = 'Describe this image';

            const response = await analyzeImage(prompt, imageFile);

            expect(response).toBe(fakeResponse);
            expect(generateContentMock).toHaveBeenCalledTimes(1);

            const callArgs = generateContentMock.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-3-pro-preview');
            expect(callArgs.contents.parts[0]).toEqual({ text: prompt });
            expect(callArgs.contents.parts[1].inlineData.mimeType).toBe('image/png');
            expect(typeof callArgs.contents.parts[1].inlineData.data).toBe('string');
        });

        it('propagates errors thrown by the SDK', async () => {
            generateContentMock.mockRejectedValue(new Error('network failure'));

            const imageFile = new File(['imgdata'], 'photo.png', { type: 'image/png' });

            await expect(analyzeImage('prompt', imageFile)).rejects.toThrow('network failure');
        });
    });

    describe('analyzeVideoFrames', () => {
        it('strips the data URI prefix from each frame and sends prompt + image parts', async () => {
            const fakeResponse = { text: 'video analysis result' };
            generateContentMock.mockResolvedValue(fakeResponse);

            const frames = [
                { data: 'data:image/jpeg;base64,AAAA', mimeType: 'image/jpeg' },
                { data: 'data:image/jpeg;base64,BBBB', mimeType: 'image/jpeg' },
            ];

            const response = await analyzeVideoFrames('Describe this video', frames);

            expect(response).toBe(fakeResponse);
            const callArgs = generateContentMock.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-3-pro-preview');

            const parts = callArgs.contents.parts;
            expect(parts[0]).toEqual({ text: 'Describe this video' });
            expect(parts[1].inlineData).toEqual({ data: 'AAAA', mimeType: 'image/jpeg' });
            expect(parts[2].inlineData).toEqual({ data: 'BBBB', mimeType: 'image/jpeg' });
        });

        it('handles errors from the SDK', async () => {
            generateContentMock.mockRejectedValue(new Error('rate limit exceeded'));

            const frames = [{ data: 'data:image/jpeg;base64,AAAA', mimeType: 'image/jpeg' }];

            await expect(analyzeVideoFrames('prompt', frames)).rejects.toThrow('rate limit exceeded');
        });
    });

    describe('groundedQuery', () => {
        it('calls the SDK with the google search tool enabled and the flash model', async () => {
            const fakeResponse = { text: 'grounded answer', candidates: [] };
            generateContentMock.mockResolvedValue(fakeResponse);

            const response = await groundedQuery('What is the latest news on X?');

            expect(response).toBe(fakeResponse);
            const callArgs = generateContentMock.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-3-flash-preview');
            expect(callArgs.contents).toBe('What is the latest news on X?');
            expect(callArgs.config.tools).toEqual([{ googleSearch: {} }]);
        });
    });

    describe('enrichVideoMetadata', () => {
        it('requests a JSON response with the expected schema and parses the result', async () => {
            const parsedPayload = {
                title: 'My Movie',
                plot: 'A thrilling plot.',
                actors: ['Actor A', 'Actor B'],
                genre: 'Action',
            };
            const fakeResponse = { text: JSON.stringify(parsedPayload) };
            generateContentMock.mockResolvedValue(fakeResponse);

            const frames = [{ data: 'data:image/jpeg;base64,CCCC', mimeType: 'image/jpeg' }];

            const response = await enrichVideoMetadata(frames);

            expect(response).toBe(fakeResponse);
            expect(JSON.parse(response.text!)).toEqual(parsedPayload);

            const callArgs = generateContentMock.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-3-pro-preview');
            expect(callArgs.config.responseMimeType).toBe('application/json');
            expect(callArgs.config.responseSchema.properties).toHaveProperty('title');
            expect(callArgs.config.responseSchema.properties).toHaveProperty('plot');
            expect(callArgs.config.responseSchema.properties).toHaveProperty('actors');
            expect(callArgs.config.responseSchema.properties).toHaveProperty('genre');

            // First part should be the analysis prompt; remaining parts are image data.
            const parts = callArgs.contents.parts;
            expect(parts[0].text).toContain('Analyze the following video frames');
            expect(parts[1].inlineData).toEqual({ data: 'CCCC', mimeType: 'image/jpeg' });
        });

        it('propagates SDK errors', async () => {
            generateContentMock.mockRejectedValue(new Error('service unavailable'));

            const frames = [{ data: 'data:image/jpeg;base64,CCCC', mimeType: 'image/jpeg' }];

            await expect(enrichVideoMetadata(frames)).rejects.toThrow('service unavailable');
        });
    });

    describe('summarizeText', () => {
        it('wraps the input text in a summarization prompt and uses the flash model', async () => {
            const fakeResponse = { text: 'A concise summary.' };
            generateContentMock.mockResolvedValue(fakeResponse);

            const response = await summarizeText('Some long text to summarize.');

            expect(response).toBe(fakeResponse);
            const callArgs = generateContentMock.mock.calls[0][0];
            expect(callArgs.model).toBe('gemini-3-flash-preview');
            expect(callArgs.contents).toContain('Some long text to summarize.');
            expect(callArgs.contents).toContain('Summarize the following text');
        });

        it('propagates errors thrown by the SDK', async () => {
            generateContentMock.mockRejectedValue(new Error('boom'));

            await expect(summarizeText('text')).rejects.toThrow('boom');
        });
    });

    it('constructs the GoogleGenAI client once at module load with an apiKey', () => {
        expect(GoogleGenAI).toHaveBeenCalled();
        const ctorArgs = (GoogleGenAI as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(ctorArgs).toHaveProperty('apiKey');
    });
});
