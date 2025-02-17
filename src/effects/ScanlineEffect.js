import { Uniform, Vector2 } from "three";
import { BlendFunction } from "./blending/BlendFunction";
import { Effect } from "./Effect";

import fragmentShader from "./glsl/scanlines/shader.frag";

/**
 * A scanline effect.
 *
 * Based on an implementation by Georg 'Leviathan' Steinrohder (CC BY 3.0):
 * http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 */

export class ScanlineEffect extends Effect {

	/**
	 * Constructs a new scanline effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.OVERLAY] - The blend function of this effect.
	 * @param {Number} [options.density=1.25] - The scanline density.
	 */

	constructor({ blendFunction = BlendFunction.OVERLAY, density = 1.25 } = {}) {

		super("ScanlineEffect", fragmentShader, {
			blendFunction,
			uniforms: new Map([
				["count", new Uniform(0.0)]
			])
		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The amount of scanlines, relative to the screen height.
		 *
		 * @type {Number}
		 * @private
		 */

		this.d = density;

	}

	/**
	 * The scanline density.
	 *
	 * @type {Number}
	 */

	get density() {

		return this.d;

	}

	set density(value) {

		this.d = value;
		this.setSize(this.resolution.width, this.resolution.height);

	}

	/**
	 * Returns the current scanline density.
	 *
	 * @deprecated Use density instead.
	 * @return {Number} The scanline density.
	 */

	getDensity() {

		return this.density;

	}

	/**
	 * Sets the scanline density.
	 *
	 * @deprecated Use density instead.
	 * @param {Number} value - The new scanline density.
	 */

	setDensity(value) {

		this.density = value;

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.uniforms.get("count").value = Math.round(height * this.density);

	}

}
