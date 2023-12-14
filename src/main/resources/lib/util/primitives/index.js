'use strict'

module.exports = {
	between,
	inRange,
	isInteger,
	parseIntOrDefault,
	parseFloatOrDefault,
	toBooleanOrDefault
}

function between (self, greaterOrEqual, less) {
	return self >= greaterOrEqual && self < less
}

function inRange (self, greaterOrEqual, lessOrEqual) {
	return self >= greaterOrEqual && self <= lessOrEqual
}

function isInteger (value) {
	return typeof value === 'number' && isFinite(value) && Math.floor(value) === value
}

/**
 * @param {string|number} dirtyInt
 * @param {number} [defaultValue] Will not be affected by min and max values
 * @param {number} [minValue]
 * @param {number} [maxValue]
 * @returns {number}
 */
function parseIntOrDefault (dirtyInt, defaultValue, minValue, maxValue) {
	let newInt = parseInt(dirtyInt)
	if (typeof newInt === 'number' && !isNaN(newInt)) {
		if (typeof minValue === 'number' && !isNaN(minValue)) {
			newInt = Math.max(minValue, newInt)
		}
		if (typeof maxValue === 'number' && !isNaN(maxValue)) {
			newInt = Math.min(maxValue, newInt)
		}
		return newInt
	}
	return defaultValue
}

/**
 * @param {number} dirtyInt
 * @param {number} [defaultValue]
 * @returns {number}
 */
function parseFloatOrDefault (dirtyInt, defaultValue) {
	const newInt = parseFloat(dirtyInt)
	if (typeof newInt === 'number' && !isNaN(newInt)) {
		return newInt
	}
	return defaultValue
}

/**
 * @param {boolean} bitOrString
 * @param {boolean} [defaultValue]
 * @returns {boolean}
 */
function toBooleanOrDefault (bitOrString, defaultValue) {
	if (bitOrString === null || bitOrString === undefined) return defaultValue
	return bitOrString === true || bitOrString === 1 || String(bitOrString).toLowerCase() === 'true'
}
