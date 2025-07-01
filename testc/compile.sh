#!/bin/bash

emcc testwasm.c \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="MyModule" \
  -s 'EXPORTED_FUNCTIONS=["_fibc"]' \
  -s 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap"]' \
  -o fibonc.js