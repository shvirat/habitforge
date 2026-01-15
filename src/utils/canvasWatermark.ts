export const applyWatermark = async (
    imageBlob: Blob,
    text: {
        habitName: string;
        userName?: string;
    }
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(imageBlob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not supported'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Watermark styling
            const fontSize = Math.floor(canvas.width * 0.04); // Responsive font size
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Watermark Content
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();
            const watermarkText = [
                `HABIT: ${text.habitName.toUpperCase()}`,
                `${date} • ${time}`,
                `HABIT FIXER • ${text.userName || 'USER'}`
            ];

            // Draw Text (Bottom Left)
            const padding = fontSize;
            let y = canvas.height - padding;

            [...watermarkText].reverse().forEach((line) => {
                ctx.fillText(line, padding, y);
                y -= (fontSize * 1.5);
            });

            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error('Watermark processing failed'));
            }, 'image/jpeg', 0.85);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
};
