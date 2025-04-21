import { Canvas, CanvasRenderingContext2D, createCanvas, Image, ImageData, loadImage } from "canvas";

/**
 * The version of the program.
 */
export const format_version = "1.0.0-alpha.5";

interface ImageCorruptorOptions {
    /**
     * The chance of a pixel being replaced.
     *
     * Must be between 0 and 1 (inclusive)
     * 
     * Does not apply to the following modes:
     * - `deepfry`
     *
     * @type {number}
     *
     * @default 0.1
     */
    replaceChance?: number;
    /**
     * If true, then when a pixel is replaced, it will start with the new color being the current color, instead of black.
     * For example when using `randomColorFullBrightnessOneChannel` mode, the new color will be the current color, with one channel set to the maximum value.
     *
     * Only applies to the following modes:
     * - `randomColorFullBrightness`
     * - `randomColorFullBrightnessOneChannel`
     * - `randomColorFullBrightnessOneOrTwoChannels`
     * - `randomColorFullBrightnessTwoChannels`
     *
     * @type {boolean}
     *
     * @default false
     */
    useCurrentColorAsDefault?: boolean;
    /**
     * If true, then when a pixel is replaced, its alpha channel is preserved.
     *
     * Does not apply to the following modes:
     * - `erase`
     * - `setToWhite`
     * - `setToBlack`
     * - `deepfry`
     *
     * @type {boolean}
     *
     * @default false
     */
    preserveAlpha?: boolean;
    /**
     * If true, then pixels with all channels being 0 are not courrupted.
     *
     * Does not apply to the following modes:
     * - `deepfry`
     *
     * @type {boolean}
     *
     * @default false
     */
    ignoreEmptyPixels?: boolean;
    /**
     * If true, then pixels with an alpha channel of 0 are not courrupted.
     *
     * Does not apply to the following modes:
     * - `deepfry
     *
     * @type {boolean}
     *
     * @default false
     */
    ignoreInvisiblePixels?: boolean;

    /**
     * The X and Y scales of the pixels, this specifies the size of each pixel,
     * setting this to a larger value may reduce file size, this will not affect
     * the width or height of the image. If not provided, the scales will both be 1.
     *
     * Does not apply to the following modes:
     * - `deepfry
     *
     * @type {[x?: number | undefined, y?: number | undefined]}
     *
     * @default
     * ```js
     * [1, 1]
     * ```
     */
    scale?: [x?: number | undefined, y?: number | undefined];
    /**
     * The contrast to use for "deepfry" mode. Should be a float, there are no range restrictions.
     *
     * A higher number will result in a more deepfried image.
     *
     * Only applies to the following modes:
     * - `deepfry`
     *
     * @type {number}
     *
     * @default 0.5
     */
    deepfryContrast?: number;
    /**
     * How many times to convert the image to a really low quality JPEG for "deepfry" mode, should be an integer greater than or equal to 0.
     *
     * A higher number will result in a more deepfried image.
     *
     * Only applies to the following modes:
     * - `deepfry`
     *
     * @type {number}
     *
     * @default 10
     */
    deepfryQualityDamage?: number;
    /**
     * The quality to use for converting the image to a really low quality JPEG for "deepfry" mode, should be a float between 0 and 1 (inclusive).
     *
     * A lower number will result in a more deepfried image.
     *
     * Only applies to the following modes:
     * - `deepfry`
     *
     * @type {number}
     *
     * @default 0.25
     */
    deepfryDamagingQuality?: number;
    /**
     * The mode to use.
     *
     * Options:
     * - `randomColor` (default) - Replaces the pixel with a random color.
     * - `randomColorFullBrightness` - Replaces the red, green, and blue channels with 0 or 255, each with a 50% chance. ex. `rgba(255, 0, 0, 1)`, `rgba(255, 255, 0, 1)`, `rgba(0, 255, 255, 1)`, or `rgba(255, 255, 255, 1)`.
     * - `randomColorFullBrightnessOneChannel` - If {@link useCurrentColorAsDefault} is true, then the new color will be the current color, with one channel set to the maximum value. Otherwise, it will be #FF0000, #00FF00, or #0000FF.
     * - `randomColorFullBrightnessRedChannel` - Replaces the red channel with 0 or 255.
     * - `randomColorFullBrightnessGreenChannel` - Replaces the green channel with 0 or 255.
     * - `randomColorFullBrightnessBlueChannel` - Replaces the blue channel with 0 or 255.
     * - `randomColorFullBrightnessOneOrTwoChannels` - If {@link useCurrentColorAsDefault} is true, then the new color will be the current color, with either one or two channels set to the maximum value. Otherwise, it will be #FF0000, #00FF00, #0000FF, #FFFF00, #FF00FF, or #00FFFF.
     * - `randomColorFullBrightnessTwoChannels` - If {@link useCurrentColorAsDefault} is true, then the new color will be the current color, with two channels set to the maximum value. Otherwise, it will be #FFFF00 #00FFFF, or #FF00FF.
     * - `erase` - Erases the pixel.
     * - `setToWhite` - Replaces the pixel with white.
     * - `setToBlack` - Replaces the pixel with black.
     * - `invert` - Inverts the pixel.
     * - `deepfry` - Deepfries the entire image. This increases contrast and lowers the quality of the image, resulting in the "deep fried" effect.
     * - `random` - Uses a random mode for each pixel.
     *
     * @type {"randomColor" | "randomColorFullBrightness" | "randomColorFullBrightnessOneChannel" | "randomColorFullBrightnessOneOrTwoChannels" | "randomColorFullBrightnessTwoChannels" | "randomColorFullBrightnessRedChannel" | "randomColorFullBrightnessGreenChannel" | "randomColorFullBrightnessBlueChannel" | "erase" | "setToWhite" | "setToBlack" | "invert" | "deepfry" | "random"}
     *
     * @default "randomColor"
     */
    mode?:
        | "randomColor"
        | "randomColorFullBrightness"
        | "randomColorFullBrightnessOneChannel"
        | "randomColorFullBrightnessOneOrTwoChannels"
        | "randomColorFullBrightnessTwoChannels"
        | "randomColorFullBrightnessRedChannel"
        | "randomColorFullBrightnessGreenChannel"
        | "randomColorFullBrightnessBlueChannel"
        | "erase"
        | "setToWhite"
        | "setToBlack"
        | "invert"
        | "deepfry"
        | "random";
    /**
     * The format for the output image.
     *
     * @type {"png" | "jpg" | "jpeg" | "pdf" | "svg"}
     *
     * @throws {TypeError} If the format is invalid.
     * @throws {TypeError} If the format is `pdf`, this is because the PDF format has been disabled due to it causing hangs.
     *
     * @default "png"
     */
    format?: "png" | "jpg" | "jpeg" | "pdf" | "svg";
    /**
     * The options for the JPEG image, only used if `options.format` is set to `jpg`.
     */
    jpegOptions?: {
        /**
         * Specifies the quality, between 0 and 1.
         *
         * @default 0.75
         */
        quality?: number;
        /**
         * Enables progressive encoding.
         *
         * @default false
         */
        progressive?: boolean;
        /**
         * Enables 2x2 chroma subsampling.
         *
         * @default false
         */
        chromaSubsampling?: boolean;
    };
}

/**
 * The list of valid modes that are not `random`.
 */
export const nonRandomModes = [
    "randomColor",
    "randomColorFullBrightness",
    "randomColorFullBrightnessOneChannel",
    "randomColorFullBrightnessOneOrTwoChannels",
    "randomColorFullBrightnessTwoChannels",
    "erase",
    "setToWhite",
    "setToBlack",
    "invert",
    "deepfry",
] as const;

/**
 * Applies a contrast effect to the image data.
 *
 * @param {ImageData} imageData The image data.
 * @param {number} val The value to apply, must be between 0 and 1 (inclusive).
 * @returns {ImageData} The image data with the contrast applied.
 *
 * @see {@link https://stackoverflow.com/a/79557593} This is the source of this function.
 */
export function applyContrast(imageData: ImageData, val: number): ImageData {
    const d = imageData.data;
    val *= 255;
    const factor = val === 255 ? 255 : (val + 255) / (255 - val);
    for (let i = 0; i < d.length; i += 4) {
        d[i + 0] = factor * (d[i + 0] - 128) + 128;
        d[i + 1] = factor * (d[i + 1] - 128) + 128;
        d[i + 2] = factor * (d[i + 2] - 128) + 128;
    }
    return imageData;
}

/**
 * Corrupts an image.
 *
 * @param {string | Buffer} src The image to corrupt.
 * @param {ImageCorruptorOptions} options The options to use.
 * @returns {Promise<Buffer<ArrayBufferLike>>} The corrupted image.
 *
 * @throws {TypeError} If the format is invalid.
 * @throws {TypeError} If the format is `pdf`, this is because the PDF format has been disabled due to it causing hangs.
 */
export async function corruptImage(src: string | Buffer, options: ImageCorruptorOptions = {}): Promise<Buffer<ArrayBufferLike>> {
    // Load the image
    /**
     * The image to corrupt.
     *
     * @type {Image}
     */
    const srcImg: Image = await loadImage(src);

    /**
     * The X scale of the image.
     *
     * Get the value from the third non-flag argument.
     *
     * @type {number}
     */
    const scaleX: number = options.scale?.[0] ?? 1;

    /**
     * The Y scale of the image.
     *
     * Get the value from the third non-flag argument.
     *
     * @type {number}
     */
    const scaleY: number = options.scale?.[1] ?? 1;

    // Check if the X scale is at least 1.
    if (scaleX < 1) {
        console.error("\u001B[38;2;255;0;0mInvalid X scale, must be at least 1. Use the --help or -h option to see the usage.\u001B[0m");
        process.exit(1);
    }

    // Check if the Y scale is at least 1.
    if (scaleY < 1) {
        console.error("\u001B[38;2;255;0;0mInvalid Y scale, must be at least 1. Use the --help or -h option to see the usage.\u001B[0m");
        process.exit(1);
    }

    // Instantiate the canvas object
    /**
     * The canvas object.
     *
     * @type {Canvas}
     */
    const canvas: Canvas = createCanvas(
        srcImg.width,
        srcImg.height,
        options.format?.toLowerCase() === "svg" ? "svg" : options.format?.toLowerCase() === "pdf" ? "pdf" : undefined
    );
    /**
     * The context of the canvas.
     *
     * @type {CanvasRenderingContext2D}
     */
    const context: CanvasRenderingContext2D = canvas.getContext("2d");

    /**
     * The canvas object.
     *
     * @type {Canvas}
     */
    const canvasB: Canvas = createCanvas(srcImg.width, srcImg.height);
    /**
     * The context of the canvas.
     *
     * @type {CanvasRenderingContext2D}
     */
    const contextB: CanvasRenderingContext2D = canvasB.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(srcImg, 0, 0);
    contextB.imageSmoothingEnabled = false;
    contextB.drawImage(srcImg, 0, 0);

    if (options.mode === "deepfry") {
        const imgData: ImageData = context.getImageData(0, 0, srcImg.width, srcImg.height);
        applyContrast(imgData, options.deepfryContrast ?? 0.5);
        context.putImageData(imgData, 0, 0);
        for (let i = 0; i < (options.deepfryQualityDamage ?? 10); i++) {
            const img = await loadImage(
                canvas.toBuffer("image/jpeg", {
                    chromaSubsampling: true,
                    progressive: false,
                    quality: options.deepfryDamagingQuality ?? 0.25,
                })
            );
            context.drawImage(img, 0, 0);
        }
    } else {
        for (let x = 0; x < srcImg.width; x++) {
            for (let y = 0; y < srcImg.height; y++) {
                /**
                 * The data of the pixel.
                 *
                 * @type {Uint8ClampedArray<ArrayBufferLike>}
                 */
                const data: Uint8ClampedArray<ArrayBufferLike> = contextB.getImageData(x, y, 1, 1).data;
                if ((options.ignoreEmptyPixels ?? false) && data.every((v) => v === 0)) continue;
                if ((options.ignoreInvisiblePixels ?? false) && data[3] === 0) continue;
                if (Math.random() >= (options.replaceChance ?? 0.1)) continue;
                /**
                 * The mode to use.
                 *
                 * @type {typeof options.mode}
                 */
                const newMode: typeof options.mode =
                    options.mode === "random"
                        ? nonRandomModes.filter((m) => m !== "deepfry")[Math.floor(Math.random() * (nonRandomModes.length - 1))]
                        : options.mode ?? "randomColor";
                switch (newMode) {
                    case "randomColor": {
                        const r: number = Math.floor(Math.random() * 256);
                        const g: number = Math.floor(Math.random() * 256);
                        const b: number = Math.floor(Math.random() * 256);
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightness": {
                        const r: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[0] : 0) : 255;
                        const g: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[1] : 0) : 255;
                        const b: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[2] : 0) : 255;
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessOneChannel": {
                        let r: number = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                        let g: number = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                        let b: number = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
                        switch (Math.floor(Math.random() * 3)) {
                            case 0: {
                                r = 255;
                                break;
                            }
                            case 1: {
                                g = 255;
                                break;
                            }
                            case 2: {
                                b = 255;
                                break;
                            }
                        }
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessOneOrTwoChannels": {
                        let r: number = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                        let g: number = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                        let b: number = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
                        if (Math.random() < 0.5) {
                            switch (Math.floor(Math.random() * 3)) {
                                case 0: {
                                    r = 255;
                                    break;
                                }
                                case 1: {
                                    g = 255;
                                    break;
                                }
                                case 2: {
                                    b = 255;
                                    break;
                                }
                            }
                        } else {
                            switch (Math.floor(Math.random() * 3)) {
                                case 0: {
                                    r = 255;
                                    g = 255;
                                    break;
                                }
                                case 1: {
                                    g = 255;
                                    b = 255;
                                    break;
                                }
                                case 2: {
                                    r = 255;
                                    b = 255;
                                    break;
                                }
                            }
                        }
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessTwoChannels":
                        {
                            let r: number = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                            let g: number = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                            let b: number = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
                            switch (Math.floor(Math.random() * 3)) {
                                case 0: {
                                    r = 255;
                                    g = 255;
                                    break;
                                }
                                case 1: {
                                    g = 255;
                                    b = 255;
                                    break;
                                }
                                case 2: {
                                    r = 255;
                                    b = 255;
                                    break;
                                }
                            }
                            context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                            context.clearRect(x, y, scaleX, scaleY);
                            context.fillRect(x, y, scaleX, scaleY);
                        }
                        break;
                    case "randomColorFullBrightnessRedChannel": {
                        const r: number = 255;
                        const g: number = data[1];
                        const b: number = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessGreenChannel": {
                        const r: number = data[0];
                        const g: number = 255;
                        const b: number = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessBlueChannel": {
                        const r: number = data[0];
                        const g: number = data[1];
                        const b: number = 255;
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "setToWhite": {
                        context.fillStyle = `rgba(255,255,255,${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "setToBlack": {
                        context.fillStyle = `rgba(0,0,0,${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "erase": {
                        context.clearRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "invert": {
                        context.fillStyle = `rgba(${255 - data[0]},${255 - data[1]},${255 - data[2]},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                }
            }
        }
    }

    /**
     * The mimeType of the output image.
     *
     * @type {"image/png" | "image/jpeg" | "application/pdf" | undefined}
     *
     * @default "image/png"
     */
    const mimeType: "image/png" | "image/jpeg" | "application/pdf" | undefined = ["jpg", "jpeg"].includes(options.format!?.toLowerCase())
        ? "image/jpeg"
        : options.format?.toLowerCase() === "pdf"
        ? "application/pdf"
        : options.format?.toLowerCase() === "svg"
        ? undefined
        : "image/png";
    let buffer: Buffer<ArrayBufferLike>;

    switch (mimeType) {
        case "application/pdf": {
            throw new Error("PDF support has been disabled due to it causing hangs.");
            // buffer = canvas.toBuffer(mimeType);
            // break;
        }
        case "image/png": {
            buffer = canvas.toBuffer(mimeType);
            break;
        }
        case "image/jpeg": {
            buffer = canvas.toBuffer(mimeType, {
                chromaSubsampling: options.jpegOptions?.chromaSubsampling ?? false,
                progressive: options.jpegOptions?.progressive ?? false,
                quality: options.jpegOptions?.quality ?? 0.75,
            });
            break;
        }
        case undefined: {
            console.warn(
                "WARNING!: Using the SVG format should currently be avoided as there is a bug where it makes the SVG image EXRTEMELY large (as in 100 MiB as opposed to 2 MiB)."
            );
            buffer = canvas.toBuffer();
            break;
        }
        default:
            throw new Error(`Unknown MIME type: ${mimeType}`);
    }

    return buffer;
}
