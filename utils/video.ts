
/**
 * Extracts a specified number of frames from a video element at evenly distributed timestamps.
 * @param video The HTMLVideoElement to extract frames from.
 * @param canvas A temporary HTMLCanvasElement to use for drawing frames.
 * @param frameCount The number of frames to extract.
 * @returns A promise that resolves with an array of frame data URLs and their MIME types.
 */
export const extractFrames = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    frameCount: number
): Promise<{ data: string; mimeType: string }[]> => {
    
    const doExtract = (duration: number): Promise<{ data: string; mimeType: string }[]> => {
        return new Promise((resolve, reject) => {
             if (!duration || isNaN(duration) || frameCount <= 0) {
                return reject(new Error("Invalid parameters for frame extraction."));
            }

            const frames: { data: string; mimeType: string }[] = [];
            const timestamps = Array.from({ length: frameCount }, (_, i) => (duration * (i + 1)) / (frameCount + 1));
            let currentIndex = 0;

            const onSeeked = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                frames.push({ data: canvas.toDataURL('image/jpeg', 0.8), mimeType: 'image/jpeg' });
                
                currentIndex++;
                if (currentIndex < timestamps.length) {
                    video.currentTime = timestamps[currentIndex];
                } else {
                    video.removeEventListener('seeked', onSeeked);
                    video.currentTime = 0; // Reset video to start
                    resolve(frames);
                }
            };
            
            video.addEventListener('seeked', onSeeked);
            video.currentTime = timestamps[currentIndex];
        });
    }

    return new Promise((resolve, reject) => {
        if (video.readyState >= 1 && video.duration) { // HAVE_METADATA or more, and duration is valid
            doExtract(video.duration).then(resolve).catch(reject);
        } else {
            const onLoadedMetadata = () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                doExtract(video.duration).then(resolve).catch(reject);
            };
            video.addEventListener('loadedmetadata', onLoadedMetadata);
        }
    });
};
