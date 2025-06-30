#include<emscripten.h>
// #include<emscripten.h>

EMSCRIPTEN_KEEPALIVE
long unsigned int fibc(long unsigned n) {
    if(n <= 1) return n;
	return fibc(n-2) + fibc(n-1);
}

