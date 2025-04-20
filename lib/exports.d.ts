/**
 * The version of the program.
 */
export declare const format_version = "1.0.0-alpha.4";
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
     * The X and Y scales of the pixels, this specifies the size of each pixel,
     * setting this to a larger value may reduce file size, this will not affect
     * the width or height of the image. If not provided, the scales will both be 1.
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
    mode?: "randomColor" | "randomColorFullBrightness" | "randomColorFullBrightnessOneChannel" | "randomColorFullBrightnessOneOrTwoChannels" | "randomColorFullBrightnessTwoChannels" | "randomColorFullBrightnessRedChannel" | "randomColorFullBrightnessGreenChannel" | "randomColorFullBrightnessBlueChannel" | "erase" | "setToWhite" | "setToBlack" | "invert" | "random";
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
export declare const nonRandomModes: readonly ["randomColor", "randomColorFullBrightness", "randomColorFullBrightnessOneChannel", "randomColorFullBrightnessOneOrTwoChannels", "randomColorFullBrightnessTwoChannels", "erase", "setToWhite", "setToBlack", "invert"];
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
export declare function corruptImage(src: string | Buffer, options?: ImageCorruptorOptions): Promise<Buffer<ArrayBufferLike>>;
export {};
//# sourceMappingURL=exports.d.ts.map