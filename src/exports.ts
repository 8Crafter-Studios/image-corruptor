import { Canvas, CanvasRenderingContext2D, createCanvas, Image, loadImage } from "canvas";

/**
 * The version of the program.
 */
export const format_version = "0.1.0-alpha.1";

interface ImageCorruptorOptions {
    /**
     * The chance of a pixel being replaced.
     *
     * Must be between 0 and 1 (inclusive)
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
     *
     * @type {boolean}
     *
     * @default false
     */
    preserveAlpha?: boolean;
    /**
     * If true, then pixels with all channels being 0 are not courrupted.
     *
     * @type {boolean}
     *
     * @default false
     */
    ignoreEmptyPixels?: boolean;
    /**
     * If true, then pixels with an alpha channel of 0 are not courrupted.
     *
     * @type {boolean}
     *
     * @default false
     */
    ignoreInvisiblePixels?: boolean;
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
     * - `random` - Uses a random mode for each pixel.
     *
     * @type {"randomColor" | "randomColorFullBrightness" | "randomColorFullBrightnessOneChannel" | "randomColorFullBrightnessOneOrTwoChannels" | "randomColorFullBrightnessTwoChannels" | "randomColorFullBrightnessRedChannel" | "randomColorFullBrightnessGreenChannel" | "randomColorFullBrightnessBlueChannel" | "erase" | "setToWhite" | "setToBlack" | "invert" | "random"}
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
] as const;

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
                options.mode === "random" ? nonRandomModes[Math.floor(Math.random() * nonRandomModes.length)] : options.mode ?? "randomColor";
            switch (newMode) {
                case "randomColor": {
                    const r: number = Math.floor(Math.random() * 256);
                    const g: number = Math.floor(Math.random() * 256);
                    const b: number = Math.floor(Math.random() * 256);
                    context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "randomColorFullBrightness": {
                    const r: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[0] : 0) : 255;
                    const g: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[1] : 0) : 255;
                    const b: number = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[2] : 0) : 255;
                    context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
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
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
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
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
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
                        context.clearRect(x, y, 1, 1);
                        context.fillRect(x, y, 1, 1);
                    }
                    break;
                case "randomColorFullBrightnessRedChannel": {
                    const r: number = 255;
                    const g: number = data[1];
                    const b: number = data[2];
                    context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "randomColorFullBrightnessGreenChannel": {
                    const r: number = data[0];
                    const g: number = 255;
                    const b: number = data[2];
                    context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "randomColorFullBrightnessBlueChannel": {
                    const r: number = data[0];
                    const g: number = data[1];
                    const b: number = 255;
                    context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "setToWhite": {
                    context.fillStyle = `rgba(255,255,255,${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "setToBlack": {
                    context.fillStyle = `rgba(0,0,0,${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
                }
                case "erase": {
                    context.clearRect(x, y, 1, 1);
                    break;
                }
                case "invert": {
                    context.fillStyle = `rgba(${255 - data[0]},${255 - data[1]},${255 - data[2]},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                    context.clearRect(x, y, 1, 1);
                    context.fillRect(x, y, 1, 1);
                    break;
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
            console.warn("WARNING!: Using the SVG format should currently be avoided as there is a bug where it makes the SVG image EXRTEMELY large (as in 100 MiB as opposed to 2 MiB).");
            buffer = canvas.toBuffer();
            break;
        }
        default:
            throw new Error(`Unknown MIME type: ${mimeType}`);
    }

    return buffer;
}
