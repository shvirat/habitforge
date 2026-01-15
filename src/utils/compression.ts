/**
 * Compresses an image file/blob to be suitable for Firestore storage (under 800KB target).
 * Uses HTML Canvas to resize and reduce quality.
 */
export const compressImage = async (file: Blob | File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        const QUALITY = 0.6; // 60% quality

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log(`Image compressed: ${file.size} -> ${blob.size} bytes`);
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                'image/jpeg',
                QUALITY
            );
        };

        img.onerror = (err) => reject(err);
    });
};
