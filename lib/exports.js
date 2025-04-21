import { createCanvas, loadImage } from "canvas";
/**
 * The version of the program.
 */
export const format_version = "1.0.0-alpha.5";
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
];
/**
 * Applies a contrast effect to the image data.
 *
 * @param {ImageData} imageData The image data.
 * @param {number} val The value to apply, must be between 0 and 1 (inclusive).
 * @returns {ImageData} The image data with the contrast applied.
 *
 * @see {@link https://stackoverflow.com/a/79557593} This is the source of this function.
 */
export function applyContrast(imageData, val) {
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
export async function corruptImage(src, options = {}) {
    // Load the image
    /**
     * The image to corrupt.
     *
     * @type {Image}
     */
    const srcImg = await loadImage(src);
    /**
     * The X scale of the image.
     *
     * Get the value from the third non-flag argument.
     *
     * @type {number}
     */
    const scaleX = options.scale?.[0] ?? 1;
    /**
     * The Y scale of the image.
     *
     * Get the value from the third non-flag argument.
     *
     * @type {number}
     */
    const scaleY = options.scale?.[1] ?? 1;
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
    const canvas = createCanvas(srcImg.width, srcImg.height, options.format?.toLowerCase() === "svg" ? "svg" : options.format?.toLowerCase() === "pdf" ? "pdf" : undefined);
    /**
     * The context of the canvas.
     *
     * @type {CanvasRenderingContext2D}
     */
    const context = canvas.getContext("2d");
    /**
     * The canvas object.
     *
     * @type {Canvas}
     */
    const canvasB = createCanvas(srcImg.width, srcImg.height);
    /**
     * The context of the canvas.
     *
     * @type {CanvasRenderingContext2D}
     */
    const contextB = canvasB.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(srcImg, 0, 0);
    contextB.imageSmoothingEnabled = false;
    contextB.drawImage(srcImg, 0, 0);
    if (options.mode === "deepfry") {
        const imgData = context.getImageData(0, 0, srcImg.width, srcImg.height);
        applyContrast(imgData, options.deepfryContrast ?? 0.5);
        context.putImageData(imgData, 0, 0);
        for (let i = 0; i < (options.deepfryQualityDamage ?? 10); i++) {
            const img = await loadImage(canvas.toBuffer("image/jpeg", {
                chromaSubsampling: true,
                progressive: false,
                quality: options.deepfryDamagingQuality ?? 0.25,
            }));
            context.drawImage(img, 0, 0);
        }
    }
    else {
        for (let x = 0; x < srcImg.width; x++) {
            for (let y = 0; y < srcImg.height; y++) {
                /**
                 * The data of the pixel.
                 *
                 * @type {Uint8ClampedArray<ArrayBufferLike>}
                 */
                const data = contextB.getImageData(x, y, 1, 1).data;
                if ((options.ignoreEmptyPixels ?? false) && data.every((v) => v === 0))
                    continue;
                if ((options.ignoreInvisiblePixels ?? false) && data[3] === 0)
                    continue;
                if (Math.random() >= (options.replaceChance ?? 0.1))
                    continue;
                /**
                 * The mode to use.
                 *
                 * @type {typeof options.mode}
                 */
                const newMode = options.mode === "random"
                    ? nonRandomModes.filter((m) => m !== "deepfry")[Math.floor(Math.random() * (nonRandomModes.length - 1))]
                    : options.mode ?? "randomColor";
                switch (newMode) {
                    case "randomColor": {
                        const r = Math.floor(Math.random() * 256);
                        const g = Math.floor(Math.random() * 256);
                        const b = Math.floor(Math.random() * 256);
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightness": {
                        const r = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[0] : 0) : 255;
                        const g = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[1] : 0) : 255;
                        const b = Math.random() < 0.5 ? (options.useCurrentColorAsDefault ?? false ? data[2] : 0) : 255;
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessOneChannel": {
                        let r = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                        let g = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                        let b = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
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
                        let r = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                        let g = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                        let b = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
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
                        }
                        else {
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
                            let r = options.useCurrentColorAsDefault ?? false ? data[0] : 0;
                            let g = options.useCurrentColorAsDefault ?? false ? data[1] : 0;
                            let b = options.useCurrentColorAsDefault ?? false ? data[2] : 0;
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
                        const r = 255;
                        const g = data[1];
                        const b = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessGreenChannel": {
                        const r = data[0];
                        const g = 255;
                        const b = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${options.preserveAlpha ?? false ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessBlueChannel": {
                        const r = data[0];
                        const g = data[1];
                        const b = 255;
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
    const mimeType = ["jpg", "jpeg"].includes(options.format?.toLowerCase())
        ? "image/jpeg"
        : options.format?.toLowerCase() === "pdf"
            ? "application/pdf"
            : options.format?.toLowerCase() === "svg"
                ? undefined
                : "image/png";
    let buffer;
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
//# sourceMappingURL=exports.js.map