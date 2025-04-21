/**
 * The version of the program.
 */
export declare const format_version = "1.0.0-alpha.5";
/**
 * The arguments passed to the CLI.
 *
 * The {@link process.argv} array without the first two elements (node and the script name).
 *
 * @type {string[]}
 */
export declare const args: string[];
/**
 * The arguments that are not flags.
 *
 * The {@link args} array without any of the strings that started with a `-`, and without the subcommand name.
 *
 * @type {string[]}
 */
export declare const nonFlagArgs: string[];
export declare function helpCommand(): void;
export declare function corruptCommand(): Promise<void>;
/**
 * Prints the version number.
 */
export declare function versionCommand(): void;
//# sourceMappingURL=image-corruptor.d.ts.map