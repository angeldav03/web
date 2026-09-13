export class SnakeGame {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SnakeGameFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_snakegame_free(ptr, 0);
    }
    /**
     * Start / pause / resume / next level / restart, depending on the current state.
     */
    action() {
        wasm.snakegame_action(this.__wbg_ptr);
    }
    /**
     * Speed at the start of each level, in cells per second.
     * @returns {number}
     */
    get base_speed() {
        const ret = wasm.snakegame_base_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get cols() {
        const ret = wasm.snakegame_cols(this.__wbg_ptr);
        return ret;
    }
    /**
     * Current direction: 0 up, 1 down, 2 left, 3 right.
     * @returns {number}
     */
    get direction() {
        const ret = wasm.snakegame_direction(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fruit positions as a flat `[x0, y0, x1, y1, ...]` array.
     * @returns {Int32Array}
     */
    fruit_cells() {
        const ret = wasm.snakegame_fruit_cells(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {number}
     */
    get fruits_eaten() {
        const ret = wasm.snakegame_fruits_eaten(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get fruits_total() {
        const ret = wasm.snakegame_fruits_total(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get length() {
        const ret = wasm.snakegame_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get level() {
        const ret = wasm.snakegame_level(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * `seed`: any number (e.g. `Date.now()`); `all_at_once`: show every fruit of the level at once.
     * @param {number} seed
     * @param {boolean} all_at_once
     */
    constructor(seed, all_at_once) {
        const ret = wasm.snakegame_new(seed, all_at_once);
        this.__wbg_ptr = ret;
        SnakeGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    pause() {
        wasm.snakegame_pause(this.__wbg_ptr);
    }
    /**
     * Draws the board scaled to the canvas size. `time_ms` drives small animations.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} time_ms
     */
    render(ctx, time_ms) {
        wasm.snakegame_render(this.__wbg_ptr, ctx, time_ms);
    }
    /**
     * @returns {number}
     */
    get rows() {
        const ret = wasm.snakegame_rows(this.__wbg_ptr);
        return ret;
    }
    /**
     * Snake body as a flat `[x, y, ...]` array, head first.
     * @returns {Int32Array}
     */
    snake_cells() {
        const ret = wasm.snakegame_snake_cells(this.__wbg_ptr);
        var v1 = getArrayI32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Current speed in cells per second.
     * @returns {number}
     */
    get speed() {
        const ret = wasm.snakegame_speed(this.__wbg_ptr);
        return ret;
    }
    /**
     * 0 Ready, 1 Playing, 2 Paused, 3 LevelComplete, 4 GameOver.
     * @returns {number}
     */
    get state() {
        const ret = wasm.snakegame_state(this.__wbg_ptr);
        return ret;
    }
    /**
     * 0 = up, 1 = down, 2 = left, 3 = right.
     * @param {number} dir
     */
    steer(dir) {
        wasm.snakegame_steer(this.__wbg_ptr, dir);
    }
    /**
     * Bitmask of events since the last call: 1 eat, 2 level complete, 4 game over.
     * @returns {number}
     */
    take_events() {
        const ret = wasm.snakegame_take_events(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get target_length() {
        const ret = wasm.snakegame_target_length(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} dt_ms
     */
    update(dt_ms) {
        wasm.snakegame_update(this.__wbg_ptr, dt_ms);
    }
}
if (Symbol.dispose) SnakeGame.prototype[Symbol.dispose] = SnakeGame.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_5d9e815e6fdf150f: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_arc_e3bb5e0478f5d999: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
            arg0.arc(arg1, arg2, arg3, arg4, arg5);
        }, arguments); },
        __wbg_beginPath_ccad41b15817641f: function(arg0) {
            arg0.beginPath();
        },
        __wbg_canvas_9c3188d85ded70f9: function(arg0) {
            const ret = arg0.canvas;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_ellipse_6bf2ec2f8845cba9: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            arg0.ellipse(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        }, arguments); },
        __wbg_fillRect_ff9957352a08db2c: function(arg0, arg1, arg2, arg3, arg4) {
            arg0.fillRect(arg1, arg2, arg3, arg4);
        },
        __wbg_fill_61b0872bf5d91622: function(arg0) {
            arg0.fill();
        },
        __wbg_height_c15ee46a1345e9af: function(arg0) {
            const ret = arg0.height;
            return ret;
        },
        __wbg_set_fillStyle_59940a18480ccdf7: function(arg0, arg1, arg2) {
            arg0.fillStyle = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_lineWidth_0b0f32c89c240172: function(arg0, arg1) {
            arg0.lineWidth = arg1;
        },
        __wbg_set_strokeStyle_2ce46a01ec1ff9ad: function(arg0, arg1, arg2) {
            arg0.strokeStyle = getStringFromWasm0(arg1, arg2);
        },
        __wbg_stroke_8a243e7601bb8549: function(arg0) {
            arg0.stroke();
        },
        __wbg_width_b5e609025d3f7451: function(arg0) {
            const ret = arg0.width;
            return ret;
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
        "./wgame_bg.js": import0,
    };
}

const SnakeGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_snakegame_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
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

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
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

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedInt32ArrayMemory0 = null;
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
        module_or_path = new URL('wgame_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
