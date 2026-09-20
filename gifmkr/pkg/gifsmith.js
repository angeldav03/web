/* @ts-self-types="./gifsmith.d.ts" */

export class GifEncoder {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GifEncoderFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gifencoder_free(ptr, 0);
    }
    /**
     * Adds a frame from an encoded image file (PNG, JPEG, GIF, WebP, BMP, TIFF, ICO).
     * @param {Uint8Array} bytes
     * @param {number} delay_ms
     */
    addFile(bytes, delay_ms) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.gifencoder_addFile(this.__wbg_ptr, ptr0, len0, delay_ms);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Adds a frame from raw RGBA pixels, which is how video frames arrive after
     * being drawn to a canvas on the JS side.
     * @param {Uint8Array} rgba
     * @param {number} width
     * @param {number} height
     * @param {number} delay_ms
     */
    addRgba(rgba, width, height, delay_ms) {
        const ptr0 = passArray8ToWasm0(rgba, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.gifencoder_addRgba(this.__wbg_ptr, ptr0, len0, width, height, delay_ms);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Number of bytes written so far, for progress reporting.
     * @returns {number}
     */
    get byteLength() {
        const ret = wasm.gifencoder_byteLength(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Closes the stream and hands over the finished GIF. Consumes the encoder.
     * @returns {Uint8Array}
     */
    finish() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.gifencoder_finish(ptr);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {number}
     */
    get frameCount() {
        const ret = wasm.gifencoder_frameCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {Options} opts
     */
    constructor(opts) {
        _assertClass(opts, Options);
        const ret = wasm.gifencoder_new(opts.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        GifEncoderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}
if (Symbol.dispose) GifEncoder.prototype[Symbol.dispose] = GifEncoder.prototype.free;

/**
 * What a source file turned out to be, without paying for a full decode.
 */
export class ImageInfo {
    static __wrap(ptr) {
        const obj = Object.create(ImageInfo.prototype);
        obj.__wbg_ptr = ptr;
        ImageInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ImageInfoFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_imageinfo_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_imageinfo_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_imageinfo_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string}
     */
    get format() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.imageinfo_format(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_imageinfo_height(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_imageinfo_width(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) ImageInfo.prototype[Symbol.dispose] = ImageInfo.prototype.free;

/**
 * Encoder settings. Construct with `new()` and assign the fields you care about;
 * every one of them has a usable default.
 */
export class Options {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        OptionsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_options_free(ptr, 0);
    }
    /**
     * Background for letterboxing and for flattening alpha, as 0xRRGGBBAA.
     * @returns {number}
     */
    get background() {
        const ret = wasm.__wbg_get_options_background(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Per-channel difference below which a pixel counts as unchanged.
     * @returns {number}
     */
    get diff_tolerance() {
        const ret = wasm.__wbg_get_options_diff_tolerance(this.__wbg_ptr);
        return ret;
    }
    /**
     * Diffuse quantisation error instead of mapping each pixel independently.
     * @returns {boolean}
     */
    get dither() {
        const ret = wasm.__wbg_get_options_dither(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * 0 = contain (letterbox), 1 = cover (centre-crop), 2 = stretch.
     * @returns {number}
     */
    get fit() {
        const ret = wasm.__wbg_get_options_fit(this.__wbg_ptr);
        return ret;
    }
    /**
     * Canvas height in pixels.
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_options_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Preserve source transparency. Ignored while `optimize` is on, which needs
     * the transparent index for its own purposes.
     * @returns {boolean}
     */
    get keep_alpha() {
        const ret = wasm.__wbg_get_options_keep_alpha(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Play count; 0 means loop forever.
     * @returns {number}
     */
    get loops() {
        const ret = wasm.__wbg_get_options_loops(this.__wbg_ptr);
        return ret;
    }
    /**
     * Palette size per frame, 2..=256.
     * @returns {number}
     */
    get max_colors() {
        const ret = wasm.__wbg_get_options_max_colors(this.__wbg_ptr);
        return ret;
    }
    /**
     * Write only the region that changed since the previous frame.
     * @returns {boolean}
     */
    get optimize() {
        const ret = wasm.__wbg_get_options_optimize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Resampling filter: 0 = nearest, 1 = triangle, 2 = catmull-rom, 3 = lanczos3.
     * @returns {number}
     */
    get resample() {
        const ret = wasm.__wbg_get_options_resample(this.__wbg_ptr);
        return ret;
    }
    /**
     * NeuQuant sampling factor, 1 (best) .. 30 (fastest).
     * @returns {number}
     */
    get speed() {
        const ret = wasm.__wbg_get_options_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * Canvas width in pixels. Every frame is brought to this size.
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_options_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    constructor() {
        const ret = wasm.options_new();
        this.__wbg_ptr = ret;
        OptionsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Background for letterboxing and for flattening alpha, as 0xRRGGBBAA.
     * @param {number} arg0
     */
    set background(arg0) {
        wasm.__wbg_set_options_background(this.__wbg_ptr, arg0);
    }
    /**
     * Per-channel difference below which a pixel counts as unchanged.
     * @param {number} arg0
     */
    set diff_tolerance(arg0) {
        wasm.__wbg_set_options_diff_tolerance(this.__wbg_ptr, arg0);
    }
    /**
     * Diffuse quantisation error instead of mapping each pixel independently.
     * @param {boolean} arg0
     */
    set dither(arg0) {
        wasm.__wbg_set_options_dither(this.__wbg_ptr, arg0);
    }
    /**
     * 0 = contain (letterbox), 1 = cover (centre-crop), 2 = stretch.
     * @param {number} arg0
     */
    set fit(arg0) {
        wasm.__wbg_set_options_fit(this.__wbg_ptr, arg0);
    }
    /**
     * Canvas height in pixels.
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_options_height(this.__wbg_ptr, arg0);
    }
    /**
     * Preserve source transparency. Ignored while `optimize` is on, which needs
     * the transparent index for its own purposes.
     * @param {boolean} arg0
     */
    set keep_alpha(arg0) {
        wasm.__wbg_set_options_keep_alpha(this.__wbg_ptr, arg0);
    }
    /**
     * Play count; 0 means loop forever.
     * @param {number} arg0
     */
    set loops(arg0) {
        wasm.__wbg_set_options_loops(this.__wbg_ptr, arg0);
    }
    /**
     * Palette size per frame, 2..=256.
     * @param {number} arg0
     */
    set max_colors(arg0) {
        wasm.__wbg_set_options_max_colors(this.__wbg_ptr, arg0);
    }
    /**
     * Write only the region that changed since the previous frame.
     * @param {boolean} arg0
     */
    set optimize(arg0) {
        wasm.__wbg_set_options_optimize(this.__wbg_ptr, arg0);
    }
    /**
     * Resampling filter: 0 = nearest, 1 = triangle, 2 = catmull-rom, 3 = lanczos3.
     * @param {number} arg0
     */
    set resample(arg0) {
        wasm.__wbg_set_options_resample(this.__wbg_ptr, arg0);
    }
    /**
     * NeuQuant sampling factor, 1 (best) .. 30 (fastest).
     * @param {number} arg0
     */
    set speed(arg0) {
        wasm.__wbg_set_options_speed(this.__wbg_ptr, arg0);
    }
    /**
     * Canvas width in pixels. Every frame is brought to this size.
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_options_width(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) Options.prototype[Symbol.dispose] = Options.prototype.free;

/**
 * Decoded pixels handed back to JS for previewing formats the browser itself
 * cannot display, such as TIFF or BMP.
 */
export class RgbaBuffer {
    static __wrap(ptr) {
        const obj = Object.create(RgbaBuffer.prototype);
        obj.__wbg_ptr = ptr;
        RgbaBufferFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RgbaBufferFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rgbabuffer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get height() {
        const ret = wasm.__wbg_get_rgbabuffer_height(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get width() {
        const ret = wasm.__wbg_get_rgbabuffer_width(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Moves the pixels to JS. The buffer is empty afterwards.
     * @returns {Uint8Array}
     */
    get data() {
        const ret = wasm.rgbabuffer_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} arg0
     */
    set height(arg0) {
        wasm.__wbg_set_rgbabuffer_height(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set width(arg0) {
        wasm.__wbg_set_rgbabuffer_width(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) RgbaBuffer.prototype[Symbol.dispose] = RgbaBuffer.prototype.free;

/**
 * Decodes an image and scales it down to fit within `max_dim`, for thumbnails.
 * @param {Uint8Array} bytes
 * @param {number} max_dim
 * @returns {RgbaBuffer}
 */
export function decode_preview(bytes, max_dim) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode_preview(ptr0, len0, max_dim);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return RgbaBuffer.__wrap(ret[0]);
}

/**
 * Reads the header of an encoded image and reports its size and format.
 * @param {Uint8Array} bytes
 * @returns {ImageInfo}
 */
export function probe(bytes) {
    const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.probe(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return ImageInfo.__wrap(ret[0]);
}

export function start() {
    wasm.start();
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_67e7344beaa85059: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg___wbindgen_throw_5d9e815e6fdf150f: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_error_17c6ade90a9e3f52: function(arg0, arg1) {
            console.error(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./gifsmith_bg.js": import0,
    };
}

const GifEncoderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gifencoder_free(ptr, 1));
const ImageInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_imageinfo_free(ptr, 1));
const OptionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_options_free(ptr, 1));
const RgbaBufferFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rgbabuffer_free(ptr, 1));

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('gifsmith_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
