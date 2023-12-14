'use strict'

const Strings = require('/lib/util/strings')
const Primitives = require('/lib/util/primitives')
const Collections = require('/lib/util/collections')

const fromArray = Collections.fromArray

module.exports = {
	trySafe,
	checkNested,
	deepClone,
	isNullOrUndefined,
	isArrayNotEmpty,
	toEmptyOrString,
	isStructured,
	visitDeep,
	isEquivalent,
	isEqual,
	isObject,
	isEmpty,
	stringifyFunction,
	fromObject,
	toNullOrObject
}

/**
 * Executes a callback in a safe way, discarding errors and returning undefined
 * @param {Function} callback Function to be executed in a safe way
 * @param {Function} onFail Function to be executed if an error occurs on the main callback
 * @param {Array} args Arguments array to supply the function callback - Optional
 */
function trySafe (callback, onFail, args) {
	if (typeof onFail !== 'function') {
		onFail = function () { }
	}
	if (typeof callback === 'function') {
		try {
			return callback.apply(this, Collections.forceArray(args))
		} catch (e) {
			return onFail.apply(this, Array.isArray(args) ? (() => { args = args.slice(0); args.unshift(e); return args })() : [e])
		}
	}
}

/**
 * @deprecated Please, use trySafe() instead
 * @param {*} obj
 */
function checkNested (obj /*, level1, level2, ... levelN */) {
	const args = Array.prototype.slice.call(arguments, 1)
	for (let i = 0; i < args.length; i++) {
		if (!obj || !Object.prototype.hasOwnProperty.call(obj, args[i])) {
			return false
		}
		obj = obj[args[i]]
	}
	return true
}

/**
 * Performs a deep cloning. Works only with JSON-able property types
 * @param {*} obj Source
 */
function deepClone (obj) {
	return JSON.parse(JSON.stringify(obj))
}

/**
 * Checks if the supplied object is null or undefined, and optionally executes true or false callbacks, if any
 * @param {*} obj Target
 * @param {Function} trueCallback Function that will be executed if target object is actually null or undefined
 * @param {Function} falseCallback Function that will be executed if target object isn't null nor undefined
 */
function isNullOrUndefined (obj, trueCallback, falseCallback) {
	if (obj === null || obj === undefined) {
		if (typeof trueCallback === 'function') {
			return trueCallback(obj)
		}
		return true
	} else {
		if (typeof falseCallback === 'function') {
			return falseCallback(obj)
		}
		return false
	}
}

function isArrayNotEmpty (array) {
	return Array.isArray(array) && array.length > 0
}

function isStructured (obj) {
	return Array.isArray(obj) || isObject(obj)
}

/**
 * Null or empty values turn into empty string. All other values turn into string
 * @param {*} value Plain value or object, if accessor is provided
 * @param {Function} optionalAccessor Optional function to extract data from value property. If not provided, value is used as is
 */
function toEmptyOrString (value, optionalAccessor) {
	const actualValue = typeof optionalAccessor === 'function' ? optionalAccessor(value) : value
	let result
	if (actualValue || actualValue === 0) {
		result = String(actualValue)
	} else {
		result = ''
	}
	return result
}

/**
 * Defaults any emptyness to null
 * @param {*} obj
 */
function toNullOrObject (obj) {
	return isEmpty(obj) ? null : obj
}

/**
 * Tree searching on object, executing callback when the keyword is found
 * @param {string} keyword Search text
 * @param {*} obj Target object tree
 * @param {*} callback Function to be called on keyword found
 */
function visitDeep (object, keyword, callbackFunction) {
	const itemExists = (searchArray, wantedObject) => {
		for (let i = 0; i < searchArray.length; i++) if (isEquivalent(searchArray[i], wantedObject)) return true
		return false
	}
	const recursiveFind = (toSearch, obj, callback) => {
		if (isNullOrUndefined(obj)) {
			return
		}
		if (Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				recursiveFind(toSearch, obj[i], callback)
			}
		} else if (typeof obj === 'object') {
			for (const key in obj) {
				recursiveFind(toSearch, obj[key], callback)
			}
		} else {
			if (String(obj).indexOf(toSearch) !== -1) {
				callback(obj)
			}
		}
	}
	const result = []
	recursiveFind(keyword, object, function (found) {
		if (!itemExists(result, found)) {
			result.push(found)
		}
		callbackFunction(found)
	})
	return result
}

/**
 * Return true if the comparison result is positive
 * @param {*} o1
 * @param {*} o2
 */
function isEquivalent (o1, o2) {
	if (o1 === o2) return true
	if (isNullOrUndefined(o1) || isNullOrUndefined(o2)) return false
	let k = ''
	for (k in o1) if (o1[k] !== o2[k]) return false
	for (k in o2) if (o1[k] !== o2[k]) return false
	return true
}

function isObject (x) {
	return x !== null && !Array.isArray(x) && typeof x === 'object' && Object.prototype.toString.call(x) === '[object Object]'
}

function isEmpty (obj) {
	let result
	let typeofObj, stringifyObj
	if ((typeofObj = typeof obj) === 'undefined' || obj === null || obj === '') {
		result = true
	} else if (Object.prototype.toString.call(obj) === '[object Date]' && !isNaN(obj)) {
		result = false
	} else if (typeofObj === 'string' || obj.constructor === String || (Array.isArray(obj) && obj.length > 0)) {
		result = false
	} else if (typeofObj === 'boolean' || (typeofObj === 'number' && !isNaN(obj)) || (typeof obj.length === 'number' && obj.length > 0)) {
		result = false
	} else if (obj.blank || obj.empty || String(obj) === 'undefined' || String(obj) === 'null' || (stringifyObj = JSON.stringify(obj)) === '{}' || stringifyObj === '[]') {
		result = true
	} else {
		const objectCopy = Object.bindProperties({}, obj)
		result = Object.keys(objectCopy).length === 0 && (objectCopy.constructor === Object)
	}
	return result
}

/**
 * Checks object type and value
 * @param {*} a
 * @param {*} b
 */
function isEqual (a, b) {
	const typeA = isObject(a)
	const typeB = isObject(b)

	if (typeA !== typeB) return false
	if (typeA) return isEquivalent(a, b) // object
	return a === b // primitive type
}

function stringifyFunction (key, value) {
	if (typeof value === 'function') {
		return String(value)
	}
	return value
}

/**
 * @constructor
 * @param {object} baseObject
 */
function Objects (baseObject) {
	this.isNullOrUndefined = baseObject === null || baseObject === undefined
	this.baseObject = baseObject || {}
}

Objects.prototype.toString = function toString (replacerFn, tabSize) {
	return JSON.stringify(this.baseObject, replacerFn, tabSize)
}

/**
 * @param {(key:string,value:never,index:number,baseObject:object)=>void} forEachCallback
 */
Objects.prototype.forEachEntry = function forEachEntry (forEachCallback) {
	const self = this
	Object.keys(self.baseObject).forEach((key, index) => {
		forEachCallback(key, self.baseObject[key], index)
	})
}

/**
 * Set the value to a object property, checking if there are still any values.
 * If it's not an array, then it turns into one and then the new value is pushed into it.
 * @param {string} objectKey
 * @param {object} newValue
 * @param {boolean} cannotRepeat
 */
Objects.prototype.pushOrPut = function pushOrPut (objectKey, newValue, cannotRepeat) {
	const canRepeat = !cannotRepeat
	if (isNullOrUndefined(this.baseObject[objectKey])) {
		this.baseObject[objectKey] = newValue
	} else {
		this.baseObject[objectKey] = Collections.forceArray(this.baseObject[objectKey])
		if (canRepeat || (cannotRepeat && !fromArray(this.baseObject[objectKey]).contains(newValue))) {
			this.baseObject[objectKey].push(newValue)
		}
	}
}

/**
 * Retrieve and remove the value from a object property, checking if the array will have a single value.
 * If so, then it's converted to the single value itself without the array.
 * If the array is empty, then it will turn into null
 * @param {string} objectKey
 * @param {object} newValue
 * @returns {object} last value or null
 */
Objects.prototype.popOrDelete = function popOrDelete (objectKey) {
	let storedValue

	if (Array.isArray(this.baseObject[objectKey])) {
		if (this.baseObject[objectKey].length === 0) {
			storedValue = null
			this.baseObject[objectKey] = null
		} else if (this.baseObject[objectKey].length === 1) {
			storedValue = this.baseObject[objectKey].pop()
			this.baseObject[objectKey] = null
		} else {
			storedValue = this.baseObject[objectKey].pop()
		}
	} else {
		storedValue = this.baseObject[objectKey]
		this.baseObject[objectKey] = null
	}

	return storedValue
}

/**
 * @param {string} path property path
 * @param {function} [fnTransform] optional custom transformation function
 */
Objects.prototype.access = function access (path, fnTransform) {
	// eslint-disable-next-line no-extra-parens
	const transform = (typeof fnTransform === 'function') ? fnTransform : (obj => obj)
	if (this.isNullOrUndefined) return
	let currObject = this.baseObject
	let section, value
	const splitPath = (path || '')
		.replace(/[\s"']/g, '')
		.replace(/[\[\]]/g, '.')
		.replace(/\.\./g, '.')
		.replace(/\.$/, '')
		.split('.')
	for (const i in splitPath) {
		section = splitPath[i]
		if (!section) {
			return transform(value)
		}
		value = currObject[section]
		if (value !== undefined) {
			currObject = value
		} else {
			return transform()
		}
	}
	return transform(currObject)
}

/**
 * @param {string} path property path
 * @param {object} valueToAssign new value
 * @param {boolean} forcePath flag that path can be created if it not exists
 */
Objects.prototype.assign = function assign (path, valueToAssign, forcePath) {
	const set = (obj, key, newValue) => (obj[key] = newValue)
	if (this.isNullOrUndefined) return
	let currObject = this.baseObject
	let section, value, lastKey
	const splitPath = (path || '')
		.replace(/[\s"']/g, '')
		.replace(/[\][]/g, '.')
		.replace(/\.\./g, '.')
		.replace(/\.$/, '')
		.split('.')
	if (splitPath.length <= 0) {
		return set([], 0, undefined)
	}
	if (splitPath.length === 1) {
		return set(currObject, splitPath[0], valueToAssign)
	}
	if (splitPath.length > 1) {
		lastKey = splitPath.splice(-1, 1)[0]
	}
	for (const i in splitPath) {
		section = splitPath[i]
		value = currObject[section]
		if (value !== undefined) {
			currObject = value
		} else if (forcePath) {
			currObject[section] = {}
			value = currObject[section]
			currObject = value
		} else {
			return set([], 0, undefined)
		}
	}
	return set(currObject, lastKey, valueToAssign)
}

/**
 * @param {string} path
 * @returns {array}
 */
Objects.prototype.accessArray = function accessArray (path) {
	return this.access(path, Collections.forceArray) || null
}

/**
 * @param {string} path
 * @returns {string}
 */
Objects.prototype.accessString = function accessString (path) {
	return this.access(path, Strings.toStringOrDefault) || null
}

/**
 * @param {string} path
 * @returns {boolean}
 */
Objects.prototype.accessBoolean = function accessBoolean (path) {
	return this.access(path, Primitives.toBooleanOrDefault) || null
}

/**
 * @param {string} path
 * @returns {number}
 */
Objects.prototype.accessInteger = function accessInteger (path) {
	return this.access(path, Primitives.parseIntOrDefault) || null
}

/**
 * @param {string} path
 * @returns {number}
 */
Objects.prototype.accessFloat = function accessFloat (path) {
	return this.access(path, Primitives.parseFloatOrDefault) || null
}

/**
 * @param {string} path
 * @returns {Date}
 */
Objects.prototype.accessDate = function accessDate (path) {
	const self = this
	return self.access(path, value => isNullOrUndefined(value) ? null : new Date(value)) || null
}

function fromObject (baseObject) {
	return new Objects(baseObject)
}
