import { format_version, corruptImage } from "./exports.js";
import * as fs from "fs";
// Print the version number.
console.log(`Version: ${format_version}`);
// Corrupt the image with each pixel having a 50% chance of being corrupted, using the "randomColor" mode, and save it to ../assets/sample_images/corruptedImage-1.png.
fs.writeFileSync("./assets/sample_images/corruptedImage-1.png", await corruptImage("./assets/test-image.jpg", {
    ignoreEmptyPixels: false,
    ignoreInvisiblePixels: false,
    replaceChance: 0.5,
    preserveAlpha: false,
    mode: "randomColor",
}));
// Corrupt the image with each pixel having a 75% chance of being corrupted, using the "randomColorFullBrightness" mode, using the current pixel color as the default color, and save it to ../assets/sample_images/corruptedImage-2.jpg.
fs.writeFileSync("./assets/sample_images/corruptedImage-2.jpg", await corruptImage("./assets/test-image.jpg", {
    ignoreEmptyPixels: false,
    ignoreInvisiblePixels: false,
    replaceChance: 0.75,
    preserveAlpha: false,
    mode: "randomColorFullBrightness",
    useCurrentColorAsDefault: true,
    format: "jpg",
    jpegOptions: { chromaSubsampling: true, progressive: true, quality: 1 },
}));
// Corrupt the image with each pixel having a 50% chance of being corrupted, using the "invert" mode, and save it to ../assets/sample_images/corruptedImage-3.pdf.
// fs.writeFileSync(
//     "./assets/sample_images/corruptedImage-3.pdf",
//     await corruptImage("./assets/test-image.jpg", {
//         ignoreEmptyPixels: false,
//         ignoreInvisiblePixels: false,
//         replaceChance: 0.5,
//         preserveAlpha: false,
//         mode: "invert",
//         format: "pdf",
//     })
// );
// Corrupt the image with each pixel having a 10% chance of being corrupted, using the a random mode for each pixel, and save it to ../assets/sample_images/corruptedImage-4.svg.
// fs.writeFileSync(
//     "./assets/sample_images/corruptedImage-4.svg",
//     await corruptImage("./assets/test-image.jpg", {
//         ignoreEmptyPixels: false,
//         ignoreInvisiblePixels: false,
//         replaceChance: 0.1,
//         preserveAlpha: false,
//         mode: "random",
//         useCurrentColorAsDefault: false,
//         format: "svg",
//     })
// );
//# sourceMappingURL=testForExports.test.js.map