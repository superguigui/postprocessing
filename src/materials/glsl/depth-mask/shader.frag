#include <common>
#include <packing>

#ifdef GL_FRAGMENT_PRECISION_HIGH

	uniform highp sampler2D depthBuffer0;
	uniform highp sampler2D depthBuffer1;

#else

	uniform mediump sampler2D depthBuffer0;
	uniform mediump sampler2D depthBuffer1;

#endif

uniform sampler2D inputBuffer;

varying vec2 vUv;

void main() {

	vec2 depth;

	#if DEPTH_PACKING_0 == 3201

		depth.x = unpackRGBAToDepth(texture2D(depthBuffer0, vUv));

	#else

		depth.x = texture2D(depthBuffer0, vUv).r;

	#endif

	#if DEPTH_PACKING_1 == 3201

		depth.y = unpackRGBAToDepth(texture2D(depthBuffer1, vUv));

	#else

		depth.y = texture2D(depthBuffer1, vUv).r;

	#endif

	depth = clamp(depth, 0.0, 1.0);

	#if DEPTH_TEST_STRATEGY == 0

		// Decide based on depth test.
		bool keep = depthTest(depth.x, depth.y);

	#elif DEPTH_TEST_STRATEGY == 1

		// Always keep max depth.
		bool keep = (depth.x == 1.0) || depthTest(depth.x, depth.y);

	#else

		// Always discard max depth.
		bool keep = (depth.x != 1.0) && depthTest(depth.x, depth.y);

	#endif

	if(keep) {

		gl_FragColor = texture2D(inputBuffer, vUv);

	} else {

		discard;

	}

}
