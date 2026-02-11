export interface ExtractedFrame {
    data: string;
    mimeType: string;
}

/**
 * Extracts evenly-spaced frames from a video element.
 * @param video - The HTMLVideoElement to extract frames from
 * @param canvas - An HTMLCanvasElement to use for rendering
 * @param count - Number of frames to extract (default: 5)
 * @returns Array of base64-encoded JPEG frames
 */
export const extractFrames = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    count: number = 5
): Promise<ExtractedFrame[]> => {
    return new Promise((resolve, reject) => {
        if (!video || !canvas) return reject(new Error('Video or Canvas element not available'));

        const frames: ExtractedFrame[] = [];
        const duration = video.duration;

        if (!duration || isNaN(duration)) {
            return reject(new Error('Invalid video duration, cannot extract frames'));
        }

        // Generate evenly-spaced timestamps excluding very start/end
        const timestamps: number[] = [];
        for (let i = 0; i < count; i++) {
            timestamps.push(duration * ((i + 1) / (count + 1)));
        }

        let index = 0;

        const seekListener = () => {
            if (index < timestamps.length) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                frames.push({
                    data: canvas.toDataURL('image/jpeg', 0.8),
                    mimeType: 'image/jpeg',
                });
                index++;
                if (index < timestamps.length) {
                    video.currentTime = timestamps[index];
                } else {
                    video.removeEventListener('seeked', seekListener);
                    resolve(frames);
                }
            }
        };

        const loadedMetadataListener = () => {
            video.addEventListener('seeked', seekListener);
            video.currentTime = timestamps[index];
        };

        video.addEventListener('loadedmetadata', loadedMetadataListener, { once: true });

        // If metadata already loaded, start immediately
        if (video.readyState >= 1) {
            loadedMetadataListener();
        }
    });
};
