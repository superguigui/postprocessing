/**
 * A blur kernel size enumeration.
 *
 * @type {Object}
 * @property {Number} VERY_SMALL - A very small kernel that matches a 7x7 Gaussian blur kernel.
 * @property {Number} SMALL - A small kernel that matches a 15x15 Gaussian blur kernel.
 * @property {Number} MEDIUM - A medium sized kernel that matches a 23x23 Gaussian blur kernel.
 * @property {Number} LARGE - A large kernel that matches a 35x35 Gaussian blur kernel.
 * @property {Number} VERY_LARGE - A very large kernel that matches a 63x63 Gaussian blur kernel.
 * @property {Number} HUGE - A huge kernel that matches a 127x127 Gaussian blur kernel.
 */

export const KernelSize = {
	VERY_SMALL: 0,
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	VERY_LARGE: 4,
	HUGE: 5
};
