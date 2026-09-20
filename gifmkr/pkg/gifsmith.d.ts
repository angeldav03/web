/* tslint:disable */
/* eslint-disable */

export class GifEncoder {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Adds a frame from an encoded image file (PNG, JPEG, GIF, WebP, BMP, TIFF, ICO).
     */
    addFile(bytes: Uint8Array, delay_ms: number): void;
    /**
     * Adds a frame from raw RGBA pixels, which is how video frames arrive after
     * being drawn to a canvas on the JS side.
     */
    addRgba(rgba: Uint8Array, width: number, height: number, delay_ms: number): void;
    /**
     * Closes the stream and hands over the finished GIF. Consumes the encoder.
     */
    finish(): Uint8Array;
    constructor(opts: Options);
    /**
     * Number of bytes written so far, for progress reporting.
     */
    readonly byteLength: number;
    readonly frameCount: number;
}

/**
 * What a source file turned out to be, without paying for a full decode.
 */
export class ImageInfo {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    height: number;
    width: number;
    readonly format: string;
}

/**
 * Encoder settings. Construct with `new()` and assign the fields you care about;
 * every one of them has a usable default.
 */
export class Options {
    free(): void;
    [Symbol.dispose](): void;
    constructor();
    /**
     * Background for letterboxing and for flattening alpha, as 0xRRGGBBAA.
     */
    background: number;
    /**
     * Per-channel difference below which a pixel counts as unchanged.
     */
    diff_tolerance: number;
    /**
     * Diffuse quantisation error instead of mapping each pixel independently.
     */
    dither: boolean;
    /**
     * 0 = contain (letterbox), 1 = cover (centre-crop), 2 = stretch.
     */
    fit: number;
    /**
     * Canvas height in pixels.
     */
    height: number;
    /**
     * Preserve source transparency. Ignored while `optimize` is on, which needs
     * the transparent index for its own purposes.
     */
    keep_alpha: boolean;
    /**
     * Play count; 0 means loop forever.
     */
    loops: number;
    /**
     * Palette size per frame, 2..=256.
     */
    max_colors: number;
    /**
     * Write only the region that changed since the previous frame.
     */
    optimize: boolean;
    /**
     * Resampling filter: 0 = nearest, 1 = triangle, 2 = catmull-rom, 3 = lanczos3.
     */
    resample: number;
    /**
     * NeuQuant sampling factor, 1 (best) .. 30 (fastest).
     */
    speed: number;
    /**
     * Canvas width in pixels. Every frame is brought to this size.
     */
    width: number;
}

/**
 * Decoded pixels handed back to JS for previewing formats the browser itself
 * cannot display, such as TIFF or BMP.
 */
export class RgbaBuffer {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    height: number;
    width: number;
    /**
     * Moves the pixels to JS. The buffer is empty afterwards.
     */
    readonly data: Uint8Array;
}

/**
 * Decodes an image and scales it down to fit within `max_dim`, for thumbnails.
 */
export function decode_preview(bytes: Uint8Array, max_dim: number): RgbaBuffer;

/**
 * Reads the header of an encoded image and reports its size and format.
 */
export function probe(bytes: Uint8Array): ImageInfo;

export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_get_imageinfo_height: (a: number) => number;
    readonly __wbg_get_imageinfo_width: (a: number) => number;
    readonly __wbg_get_options_background: (a: number) => number;
    readonly __wbg_get_options_diff_tolerance: (a: number) => number;
    readonly __wbg_get_options_dither: (a: number) => number;
    readonly __wbg_get_options_fit: (a: number) => number;
    readonly __wbg_get_options_height: (a: number) => number;
    readonly __wbg_get_options_keep_alpha: (a: number) => number;
    readonly __wbg_get_options_loops: (a: number) => number;
    readonly __wbg_get_options_max_colors: (a: number) => number;
    readonly __wbg_get_options_optimize: (a: number) => number;
    readonly __wbg_get_options_resample: (a: number) => number;
    readonly __wbg_get_options_speed: (a: number) => number;
    readonly __wbg_get_options_width: (a: number) => number;
    readonly __wbg_get_rgbabuffer_height: (a: number) => number;
    readonly __wbg_get_rgbabuffer_width: (a: number) => number;
    readonly __wbg_gifencoder_free: (a: number, b: number) => void;
    readonly __wbg_imageinfo_free: (a: number, b: number) => void;
    readonly __wbg_options_free: (a: number, b: number) => void;
    readonly __wbg_rgbabuffer_free: (a: number, b: number) => void;
    readonly __wbg_set_imageinfo_height: (a: number, b: number) => void;
    readonly __wbg_set_imageinfo_width: (a: number, b: number) => void;
    readonly __wbg_set_options_background: (a: number, b: number) => void;
    readonly __wbg_set_options_diff_tolerance: (a: number, b: number) => void;
    readonly __wbg_set_options_dither: (a: number, b: number) => void;
    readonly __wbg_set_options_fit: (a: number, b: number) => void;
    readonly __wbg_set_options_height: (a: number, b: number) => void;
    readonly __wbg_set_options_keep_alpha: (a: number, b: number) => void;
    readonly __wbg_set_options_loops: (a: number, b: number) => void;
    readonly __wbg_set_options_max_colors: (a: number, b: number) => void;
    readonly __wbg_set_options_optimize: (a: number, b: number) => void;
    readonly __wbg_set_options_resample: (a: number, b: number) => void;
    readonly __wbg_set_options_speed: (a: number, b: number) => void;
    readonly __wbg_set_options_width: (a: number, b: number) => void;
    readonly __wbg_set_rgbabuffer_height: (a: number, b: number) => void;
    readonly __wbg_set_rgbabuffer_width: (a: number, b: number) => void;
    readonly decode_preview: (a: number, b: number, c: number) => [number, number, number];
    readonly gifencoder_addFile: (a: number, b: number, c: number, d: number) => [number, number];
    readonly gifencoder_addRgba: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly gifencoder_byteLength: (a: number) => number;
    readonly gifencoder_finish: (a: number) => [number, number, number, number];
    readonly gifencoder_frameCount: (a: number) => number;
    readonly gifencoder_new: (a: number) => [number, number, number];
    readonly imageinfo_format: (a: number) => [number, number];
    readonly options_new: () => number;
    readonly probe: (a: number, b: number) => [number, number, number];
    readonly rgbabuffer_data: (a: number) => [number, number];
    readonly start: () => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
