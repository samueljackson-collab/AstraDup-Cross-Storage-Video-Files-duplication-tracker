import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFrames } from '../../../utils/video';

/**
 * jsdom does not implement real video decoding, so we create lightweight
 * fake HTMLVideoElement / HTMLCanvasElement objects that mimic the subset
 * of the DOM API that `extractFrames` relies on:
 *  - video.readyState, video.duration, video.videoWidth/Height
 *  - video.currentTime (setter triggers a 'seeked' event)
 *  - video.addEventListener/removeEventListener for 'seeked' & 'loadedmetadata'
 *  - canvas.getContext('2d') returning an object with drawImage
 *  - canvas.toDataURL(...)
 */

interface FakeVideoOptions {
    duration: number;
    readyState?: number;
    videoWidth?: number;
    videoHeight?: number;
}

const createFakeVideo = ({ duration, readyState = 1, videoWidth = 640, videoHeight = 480 }: FakeVideoOptions) => {
    const listeners: Record<string, Array<() => void>> = {};
    let _currentTime = 0;

    const video = {
        duration,
        readyState,
        videoWidth,
        videoHeight,
        addEventListener: vi.fn((event: string, cb: () => void) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: () => void) => {
            if (!listeners[event]) return;
            listeners[event] = listeners[event].filter(fn => fn !== cb);
        }),
        get currentTime() {
            return _currentTime;
        },
        set currentTime(value: number) {
            _currentTime = value;
            // Simulate the browser firing 'seeked' asynchronously after a seek.
            queueMicrotask(() => {
                (listeners['seeked'] || []).slice().forEach(cb => cb());
            });
        },
        // Helper for tests to manually fire 'loadedmetadata'
        __fireLoadedMetadata: () => {
            (listeners['loadedmetadata'] || []).slice().forEach(cb => cb());
        },
    };

    return video as unknown as HTMLVideoElement & { __fireLoadedMetadata: () => void };
};

const createFakeCanvas = () => {
    const drawImage = vi.fn();
    const toDataURL = vi.fn((type: string) => `data:${type};base64,FAKEDATA`);

    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage })),
        toDataURL,
    };

    return { canvas: canvas as unknown as HTMLCanvasElement, drawImage, toDataURL };
};

describe('extractFrames', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('extracts the requested number of frames for a normal duration', async () => {
        const video = createFakeVideo({ duration: 100, readyState: 1 });
        const { canvas, toDataURL } = createFakeCanvas();

        const frames = await extractFrames(video, canvas, 5);

        expect(frames).toHaveLength(5);
        expect(toDataURL).toHaveBeenCalledTimes(5);
    });

    it('returns frames as data URL strings with the expected mimeType', async () => {
        const video = createFakeVideo({ duration: 60, readyState: 1 });
        const { canvas } = createFakeCanvas();

        const frames = await extractFrames(video, canvas, 3);

        frames.forEach(frame => {
            expect(typeof frame.data).toBe('string');
            expect(frame.data.startsWith('data:image/jpeg')).toBe(true);
            expect(frame.mimeType).toBe('image/jpeg');
        });
    });

    it('uses evenly distributed timestamps across the video duration', async () => {
        const duration = 100;
        const frameCount = 3;
        const video = createFakeVideo({ duration, readyState: 1 });
        const { canvas } = createFakeCanvas();

        // Spy on the currentTime setter by wrapping the existing accessor.
        const setTimes: number[] = [];
        const descriptor = Object.getOwnPropertyDescriptor(video, 'currentTime')!;
        Object.defineProperty(video, 'currentTime', {
            get: descriptor.get,
            set(value: number) {
                setTimes.push(value);
                descriptor.set!.call(video, value);
            },
        });

        await extractFrames(video, canvas, frameCount);

        // Expect timestamps roughly at duration/(frameCount+1) intervals,
        // plus a final reset to 0.
        const expectedTimestamps = Array.from({ length: frameCount }, (_, i) => (duration * (i + 1)) / (frameCount + 1));
        expectedTimestamps.forEach(expected => {
            expect(setTimes).toContain(expected);
        });
        // The video should be reset to the start after extraction.
        expect(setTimes[setTimes.length - 1]).toBe(0);
    });

    it('rejects when frameCount is zero or negative (invalid parameters)', async () => {
        const video = createFakeVideo({ duration: 50, readyState: 1 });
        const { canvas } = createFakeCanvas();

        await expect(extractFrames(video, canvas, 0)).rejects.toThrow('Invalid parameters for frame extraction.');
        await expect(extractFrames(video, canvas, -2)).rejects.toThrow('Invalid parameters for frame extraction.');
    });

    it('rejects when video duration is zero (waiting on loadedmetadata)', async () => {
        const video = createFakeVideo({ duration: 0, readyState: 1 });
        const { canvas } = createFakeCanvas();

        const framesPromise = extractFrames(video, canvas, 5);

        // duration is falsy (0), so extractFrames waits for 'loadedmetadata'
        // before re-checking video.duration and rejecting.
        (video as any).__fireLoadedMetadata();

        await expect(framesPromise).rejects.toThrow('Invalid parameters for frame extraction.');
    });

    it('rejects when video duration is NaN (waiting on loadedmetadata)', async () => {
        const video = createFakeVideo({ duration: NaN, readyState: 1 });
        const { canvas } = createFakeCanvas();

        const framesPromise = extractFrames(video, canvas, 5);

        // duration is falsy (NaN), so extractFrames waits for 'loadedmetadata'
        // before re-checking video.duration and rejecting.
        (video as any).__fireLoadedMetadata();

        await expect(framesPromise).rejects.toThrow('Invalid parameters for frame extraction.');
    });

    it('waits for loadedmetadata when readyState indicates metadata is not yet available', async () => {
        const video = createFakeVideo({ duration: 30, readyState: 0 });
        const { canvas } = createFakeCanvas();

        const framesPromise = extractFrames(video, canvas, 2);

        // Frame extraction should not have started yet (no 'seeked' listeners registered).
        expect((video.addEventListener as ReturnType<typeof vi.fn>).mock.calls.some(([e]) => e === 'seeked')).toBe(false);

        // Now simulate metadata becoming available.
        (video as any).__fireLoadedMetadata();

        const frames = await framesPromise;
        expect(frames).toHaveLength(2);
    });

    it('resizes the canvas to match the video dimensions before drawing', async () => {
        const video = createFakeVideo({ duration: 10, readyState: 1, videoWidth: 1280, videoHeight: 720 });
        const { canvas, drawImage } = createFakeCanvas();

        await extractFrames(video, canvas, 1);

        expect(canvas.width).toBe(1280);
        expect(canvas.height).toBe(720);
        expect(drawImage).toHaveBeenCalledTimes(1);
    });

    it('resets currentTime to 0 after extracting all frames', async () => {
        const video = createFakeVideo({ duration: 20, readyState: 1 });
        const { canvas } = createFakeCanvas();

        await extractFrames(video, canvas, 1);

        expect(video.currentTime).toBe(0);
    });
});
