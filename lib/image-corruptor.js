import { createCanvas, loadImage } from "canvas";
import * as fs from "fs";
import path from "path";
import ProgressBar from "progress";
import { nonRandomModes } from "./exports.js";
/**
 * The version of the program.
 */
const format_version = "1.0.0-alpha.2";
/**
 * The arguments passed to the CLI.
 *
 * The {@link process.argv} array without the first two elements (node and the script name).
 *
 * @type {string[]}
 */
const args = process.argv.slice(2);
/**
 * The arguments that are not flags.
 *
 * The {@link args} array without any of the strings that started with a `-`, and without the subcommand name.
 *
 * @type {string[]}
 */
const nonFlagArgs = args.slice(1).filter((arg) => !arg.startsWith("-"));
switch (args[0]?.toLowerCase()) {
    case "version":
        versionCommand();
        break;
    case "-h":
    case "--help":
    case "help":
        helpCommand();
        break;
    case "corrupt":
        await corruptCommand();
        break;
    case undefined:
        console.error("\u001B[38;2;255;0;0mNo subcommand provided. Use the help subcommand to see the usage.\u001B[0m");
        process.exit(1);
    default:
        console.error("\u001B[38;2;255;0;0mInvalid subcommand: " + args[0] + ". Use the help subcommand to see the usage.\u001B[0m");
        process.exit(1);
}
function helpCommand() {
    // Print the help message.
    console.log(`Usage:

image-corruptor corrupt [options] [globDir] [sourceGlob] [sourceExcludeGlob]    Generate a random image of the specified dimensions.
image-corruptor version                                                         Shows the version number.
image-corruptor help                                                            Show this help message.
image-corruptor -h                                                              Show this help message.
image-corruptor --help                                                          Show this help message.

Options:
  -o, --out=<directory>             The directory to place the corrupted images in. Default is "./corruptedImages".
  -s, --scale=<scale>               The scale of the pixels, this specifies the size of each pixel, this will not affect the width or height of the image. If not provided, the scale will be 1. Format should be "scaleX:scaleY" or "scale".
  -rc, --replace-chance=<chance>    Set the chance of replacing a pixel with a random pixel, should be a float between 0 and 1 (inclusive). Default is 0.1.
  -ie, --ignore-empty               Do not corrupt pixels that have all channels set to 0.
  -ii, --ignore-invisible           Do not corrupt pixels that have the alpha channel set to 0.
  -ucd, --use-current-as-default    Use the current pixel color as the default color for corrupted pixels (instead of black).
  -m, --mode=<mode>                 Set the mode to use when corrupting pixels, see the "Modes" section for more information.
  -pa, --preserve-alpha             Preserve the alpha channel of each pixel.
  -jpg, -jpeg                       Output the image in JPEG format instead of PNG format.
  -pdf (DISABLED)                   Output the image in PDF format instead of PNG format (this option has been disabled due to it causing hangs).
  -svg (DO NOT USE)                 Output the image in SVG format instead of PNG format (WARNING: This option should NOT be used, as there is currently a bug where is makes the SVG image EXRTEMELY large (as in 100 MiB as opposed to 2 MiB)).
  --chroma-subsampling              Enable chroma subsampling for JPEG images.
  --progressive                     Enable progressive encoding for JPEG images.
  --quality=<quality>               Set the quality of the JPEG image, should be a float between 0 and 1 (inclusive). Default is 0.75.

Paramters:
[globDir]                       The directory to search for source images that match the glob pattern. Default is "./".
[sourceGlob]                    The glob pattern for the source images to corrupt, must be a valid JSON string, if it includes spaces, it must be wrapped in quotes. Default is ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif"].
[sourceExcludeGlob]             The glob pattern for the source images to exclude, must be a valid JSON string, if it includes spaces, it must be wrapped in quotes. Default is ["**/node_modules/**", "**/corruptedImages/**"].

Modes:
randomColor (default) - Replaces the pixel with a random color.
randomColorFullBrightness - Replaces the red, green, and blue channels with 0 or 255, each with a 50% chance. ex. rgba(255, 0, 0, 1), rgba(255, 255, 0, 1), rgba(0, 255, 255, 1), or rgba(255, 255, 255, 1).
randomColorFullBrightnessOneChannel - If useCurrentColorAsDefault is true, then the new color will be the current color, with one channel set to the maximum value. Otherwise, it will be #FF0000, #00FF00, or #0000FF.
randomColorFullBrightnessRedChannel - Replaces the red channel with 0 or 255.
randomColorFullBrightnessGreenChannel - Replaces the green channel with 0 or 255.
randomColorFullBrightnessBlueChannel - Replaces the blue channel with 0 or 255.
randomColorFullBrightnessOneOrTwoChannels - If useCurrentColorAsDefault is true, then the new color will be the current color, with either one or two channels set to the maximum value. Otherwise, it will be #FF0000, #00FF00, #0000FF, #FFFF00, #FF00FF, or #00FFFF.
randomColorFullBrightnessTwoChannels - If useCurrentColorAsDefault is true, then the new color will be the current color, with two channels set to the maximum value. Otherwise, it will be #FFFF00 #00FFFF, or #FF00FF.
erase - Erases the pixel.
setToWhite - Replaces the pixel with white.
setToBlack - Replaces the pixel with black.
invert - Inverts the pixel.
random - Uses a random mode for each pixel.`);
    process.exit(0);
}
async function corruptCommand() {
    /**
     * The type of the canvas.
     *
     * @type {"pdf" | "svg" | undefined}
     */
    let type = undefined;
    /**
     * The format of the image file.
     *
     * @type {"image/png" | "image/jpeg" | "application/pdf" | undefined}
     */
    let format = "image/png";
    if (args.includes("-pdf")) {
        type = "pdf";
        format = "application/pdf";
    }
    else if (args.includes("-svg")) {
        type = "svg";
        format = undefined;
    }
    else if (args.includes("-jpg") || args.includes("-jpeg")) {
        format = "image/jpeg";
    }
    const rawScale = args.find((arg) => arg.startsWith("-s=") || arg.startsWith("--scale="))?.split("=")[1] ?? "1";
    /**
     * The X scale of the image.
     *
     * @type {number}
     */
    const scaleX = /^[0-9]+$/.test(rawScale) ? Number(rawScale) : Number(rawScale.match(/^x?([0-9]+)[:,\\\/;\-&|xy]([0-9]+)y?$/)?.[1] ?? 1);
    /**
     * The Y scale of the image.
     *
     * @type {number}
     */
    const scaleY = /^[0-9]+$/.test(rawScale) ? Number(rawScale) : Number(rawScale.match(/^x?[0-9]+[:,\\\/;\-&|xy]([0-9]+)y?$/)?.[1] ?? 1);
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
    // Configuration
    /**
     * The glob patterns for the source images to corrupt.
     *
     * @type {string[]}
     *
     * @default
     * ```js
     * ["**\/*.png", "**\/*.jpg", "**\/*.jpeg", "**\/*.gif"]
     * ```
     */
    const sourceImageGlobs = nonFlagArgs.length > 1 ? JSON.parse(nonFlagArgs[1]) : ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif"];
    if (!(sourceImageGlobs instanceof Array)) {
        console.error("[sourceGlob] must be a stringified JSON array.");
        process.exit(1);
    }
    if (sourceImageGlobs.some((glob) => typeof glob !== "string")) {
        console.error("[sourceGlob] must only include strings.");
        process.exit(1);
    }
    /**
     * The glob patterns for the source images to exclude.
     *
     * @type {string[]}
     *
     * @default
     * ```js
     * ["**\/node_modules/**", "**\/corruptedImages/**"]
     * ```
     */
    const sourceImageExcludeGlobs = nonFlagArgs.length > 2 ? JSON.parse(nonFlagArgs[2]) : ["**/node_modules/**", "**/corruptedImages/**"];
    if (!(sourceImageExcludeGlobs instanceof Array)) {
        console.error("[sourceExcludeGlob] must be a stringified JSON array.");
        process.exit(1);
    }
    if (sourceImageExcludeGlobs.some((glob) => typeof glob !== "string")) {
        console.error("[sourceExcludeGlob] must only include strings.");
        process.exit(1);
    }
    /**
     * The directory to search for source images that match the glob pattern.
     *
     * @type {string}
     *
     * @default "./"
     */
    const globDir = nonFlagArgs.length > 0 ? nonFlagArgs[0] : "./";
    /**
     * The directory to search for source images that match the glob pattern.
     *
     * @type {string}
     *
     * @default "./corruptedImages"
     */
    const outDir = args.find((arg) => arg.startsWith("-o=") || arg.startsWith("--out="))?.split("=")[1] ?? "./corruptedImages";
    /**
     * The chance of a pixel being replaced.
     *
     * Must be between 0 and 1 (inclusive)
     *
     * @type {number}
     *
     * @default 0.1
     */
    const replaceChance = Number(args.find((arg) => arg.startsWith("-rc=") || arg.startsWith("--replace-chance="))?.split("=")[1] ?? 0.1);
    /**
     * If true, then pixels with all channels being 0 are not courrupted.
     *
     * @type {boolean}
     *
     * @default false
     */
    const ignoreEmptyPixels = args.includes("-ie") || args.includes("--ignore-empty");
    /**
     * If true, then pixels with an alpha channel of 0 are not courrupted.
     *
     * @type {boolean}
     *
     * @default false
     */
    const ignoreInvisiblePixels = args.includes("-ii") || args.includes("--ignore-invisible");
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
    const useCurrentColorAsDefault = args.includes("-ucd") || args.includes("--use-current-as-default");
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
    const preserveAlpha = args.includes("-pa") || args.includes("--preserve-alpha");
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
    let mode = args.find((arg) => arg.startsWith("-m=") || arg.startsWith("--mode="))?.split("=")[1] ?? "randomColor";
    /**
     * The working directory to use for globbing.
     *
     * @type {string}
     */
    const globWorkingDirectory = path.join(process.cwd(), path.relative("./", globDir));
    // # DEBUG
    // console.log(globWorkingDirectory);
    /**
     * The source images to corrupt.
     *
     * @type {string[]}
     */
    const sourceImages = [...new Set(sourceImageGlobs.map((v) => fs.globSync(v, { cwd: globWorkingDirectory })).flat())]
        .filter(sourceImageExcludeGlobs.length === 0 ? (v) => true : (v) => !sourceImageExcludeGlobs.some((g) => path.matchesGlob(v, g)))
        .map((v) => path.join(globWorkingDirectory, v));
    if (sourceImages.length === 0) {
        console.error("No source images found.");
        process.exit(1);
    }
    /**
     * The progress bar.
     *
     * @type {ProgressBar}
     */
    const bar = new ProgressBar("-> Corrupting :bar :percent (:current/:total); :rate/fps; ETA: :etas; Time elapsed: :elapseds", {
        total: sourceImages.length,
        width: 30,
        complete: "\u001B[48;2;0;255;0m \u001B[0m",
        incomplete: "\u001B[48;5;0m \u001B[0m",
    });
    // This is to keep the type as a union type instead of a string literal.
    // @ts-ignore
    mode = mode === "random" ? "random" + "" : mode;
    for (const sourceImage of sourceImages) {
        // Load the image
        /**
         * The image to corrupt.
         *
         * @type {Image}
         */
        const srcImg = await loadImage(sourceImage);
        // Instantiate the canvas object
        /**
         * The canvas object.
         *
         * @type {Canvas}
         */
        const canvas = createCanvas(srcImg.width, srcImg.height, type);
        /**
         * The context of the canvas.
         *
         * @type {CanvasRenderingContext2D}
         */
        const context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        context.drawImage(srcImg, 0, 0);
        for (let x = 0; x < srcImg.width; x += scaleX) {
            for (let y = 0; y < srcImg.height; y += scaleY) {
                /**
                 * The data of the pixel.
                 *
                 * @type {Uint8ClampedArray<ArrayBufferLike>}
                 */
                const data = context.getImageData(x, y, 1, 1).data;
                if (ignoreEmptyPixels && data.every((v) => v === 0))
                    continue;
                if (ignoreInvisiblePixels && data[3] === 0)
                    continue;
                if (Math.random() >= replaceChance)
                    continue;
                /**
                 * The mode to use.
                 *
                 * @type {typeof mode}
                 */
                const newMode = mode === "random" ? nonRandomModes[Math.floor(Math.random() * nonRandomModes.length)] : mode;
                switch (newMode) {
                    case "randomColor": {
                        const r = Math.floor(Math.random() * 256);
                        const g = Math.floor(Math.random() * 256);
                        const b = Math.floor(Math.random() * 256);
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightness": {
                        const r = Math.random() < 0.5 ? (useCurrentColorAsDefault ? data[0] : 0) : 255;
                        const g = Math.random() < 0.5 ? (useCurrentColorAsDefault ? data[1] : 0) : 255;
                        const b = Math.random() < 0.5 ? (useCurrentColorAsDefault ? data[2] : 0) : 255;
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessOneChannel": {
                        let r = useCurrentColorAsDefault ? data[0] : 0;
                        let g = useCurrentColorAsDefault ? data[1] : 0;
                        let b = useCurrentColorAsDefault ? data[2] : 0;
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
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessOneOrTwoChannels": {
                        let r = useCurrentColorAsDefault ? data[0] : 0;
                        let g = useCurrentColorAsDefault ? data[1] : 0;
                        let b = useCurrentColorAsDefault ? data[2] : 0;
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
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessTwoChannels":
                        {
                            let r = useCurrentColorAsDefault ? data[0] : 0;
                            let g = useCurrentColorAsDefault ? data[1] : 0;
                            let b = useCurrentColorAsDefault ? data[2] : 0;
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
                            context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                            context.clearRect(x, y, scaleX, scaleY);
                            context.fillRect(x, y, scaleX, scaleY);
                        }
                        break;
                    case "randomColorFullBrightnessRedChannel": {
                        const r = 255;
                        const g = data[1];
                        const b = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessGreenChannel": {
                        const r = data[0];
                        const g = 255;
                        const b = data[2];
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "randomColorFullBrightnessBlueChannel": {
                        const r = data[0];
                        const g = data[1];
                        const b = 255;
                        context.fillStyle = `rgba(${r},${g},${b},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "setToWhite": {
                        context.fillStyle = `rgba(255,255,255,${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "setToBlack": {
                        context.fillStyle = `rgba(0,0,0,${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "erase": {
                        context.clearRect(x, y, scaleX, scaleY);
                        break;
                    }
                    case "invert": {
                        context.fillStyle = `rgba(${255 - data[0]},${255 - data[1]},${255 - data[2]},${preserveAlpha ? data[3] / 255 : 1})`;
                        context.clearRect(x, y, scaleX, scaleY);
                        context.fillRect(x, y, scaleX, scaleY);
                        break;
                    }
                }
            }
        }
        /**
         * The output directory of the corrupted image.
         *
         * @type {string}
         */
        const imageOutDir = path.join(outDir, path.relative(globWorkingDirectory, path.dirname(sourceImage)));
        /**
         * The output path of the corrupted image.
         *
         * @type {string}
         */
        const imageOutPath = path.join(imageOutDir, `${path.parse(path.basename(sourceImage)).name}${path.parse(path.basename(sourceImage)).ext}`
        // `${path.parse(path.basename(sourceImage)).name}-corrupted_${replaceChance}-${Date.now()}${path.parse(path.basename(sourceImage)).ext}`
        );
        /**
         * The output buffer of the corrupted image.
         *
         * @type {Buffer<ArrayBufferLike>}
         */
        let buffer;
        switch (format) {
            case "application/pdf":
                throw new Error("PDF support has been disabled due to it causing hangs.");
            // buffer = canvas.toBuffer(format);
            // break;
            case "image/png":
                buffer = canvas.toBuffer(format);
                break;
            case "image/jpeg":
                buffer = canvas.toBuffer(format, {
                    chromaSubsampling: args.includes("--chroma-subsampling"),
                    progressive: args.includes("--progressive"),
                    quality: Number(args.find((arg) => arg.startsWith("--quality="))?.split("=")[1] ?? 0.75),
                });
                break;
            case undefined:
                console.warn("WARNING!: Using the SVG format should currently be avoided as there is a bug where it makes the SVG image EXRTEMELY large (as in 100 MiB as opposed to 2 MiB).");
                buffer = canvas.toBuffer();
                break;
            default:
                throw new Error(`Unknown MIME type: ${format}`);
        }
        fs.mkdirSync(imageOutDir, { recursive: true });
        fs.writeFileSync(imageOutPath, buffer);
        bar.tick();
    }
}
/**
 * Prints the version number.
 */
function versionCommand() {
    // Print the version number.
    console.log(`image-corruptor v${format_version}`);
}
//# sourceMappingURL=image-corruptor.js.map