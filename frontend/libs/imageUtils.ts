export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: PixelCrop,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
        fileName?: string;
    }
): Promise<File> {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.88,
        fileName = 'image.webp',
    } = options || {};

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D context is not available');
    }

    let targetWidth = Math.round(pixelCrop.width);
    let targetHeight = Math.round(pixelCrop.height);

    const scale = Math.min(
        1,
        maxWidth / targetWidth,
        maxHeight / targetHeight
    );

    targetWidth = Math.max(1, Math.round(targetWidth * scale));
    targetHeight = Math.max(1, Math.round(targetHeight * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        Math.round(pixelCrop.x),
        Math.round(pixelCrop.y),
        Math.round(pixelCrop.width),
        Math.round(pixelCrop.height),
        0,
        0,
        targetWidth,
        targetHeight
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    canvas.toBlob(
                        (fallbackBlob) => {
                            if (!fallbackBlob) {
                                reject(new Error('Failed to create image blob'));
                                return;
                            }
                            const cleanName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
                            resolve(new File([fallbackBlob], cleanName, { type: 'image/jpeg' }));
                        },
                        'image/jpeg',
                        quality
                    );
                    return;
                }
                const cleanName = fileName.replace(/\.[^/.]+$/, '') + '.webp';
                resolve(new File([blob], cleanName, { type: 'image/webp' }));
            },
            'image/webp',
            quality
        );
    });
}

export async function compressImage(
    file: File,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
        quality?: number;
    }
): Promise<File> {
    if (file.type === 'image/gif' || file.size < 150 * 1024) {
        return file;
    }

    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.85,
    } = options || {};

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await createImage(objectUrl);
        const naturalWidth = image.naturalWidth || image.width;
        const naturalHeight = image.naturalHeight || image.height;

        if (naturalWidth <= maxWidth && naturalHeight <= maxHeight && file.size < 500 * 1024) {
            return file;
        }

        const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        return await new Promise<File>((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                    resolve(new File([blob], cleanName, { type: 'image/webp' }));
                },
                'image/webp',
                quality
            );
        });
    } catch (err) {
        console.warn('Image compression failed, using original file:', err);
        return file;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
