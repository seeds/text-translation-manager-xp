'use strict'

const java = {
	util: {
		List: Java.type('java.util.ArrayList'),
		Set: Java.type('java.util.LinkedHashSet')
	}
}

module.exports = {
	Arrays,
	Stack,
	EntryList,
	forceArray,
	arrayReplace,
	fromArray,
	fromArrayCopy,
	unique,
	itemExists,
	whereAny,
	sortObjectByKeyRecursive,
	sortBy,
	chunk,
	paginationScreen,
	castToEntryList,
	removeDuplicates
}

/**
 * Guarantee that supplied argument is an array by encapsulating it, if required
 * @param {*} data Target object
 * @returns {[]}
 */
function forceArray(data) {
	if (data === null || data === undefined) {
		data = []
	} else if (Object.prototype.toString.call(data) === '[object Arguments]') {
		data = Array.prototype.slice.call(data)
	} else if (!Array.isArray(data)) {
		data = [data]
	}
	return data
}

// Split array into chunks with size = n
function chunk(arr, n) {
	if (n > 0) {
		const R = []
		for (let i = 0; i < arr.length; i += n) { R.push(arr.slice(i, i + n)) }
		return R
	} else {
		return arr
	}
}

function unique(sourceArray) {
	const array = this || sourceArray
	const set = new java.util.Set(__.toScriptObject(array))
	return __.toNativeObject(new java.util.List(set))
}

/**
 * Check if the searchArray contains a object with the same properties as the wantedObject
 * @param {Array} searchArray
 * @param {*} wantedObject
 * @param {function} comparer You can use Objects.isEquivalent
 */
function itemExists(searchArray, wantedObject, comparer) {
	for (let i = 0; i < searchArray.length; i++) if (comparer(searchArray[i], wantedObject)) return true
	return false
}

/**
 * Return a function that can be used as parameter for Array.some or Array.every.
 * The returned function compares properties from searchMap with the given element and, if any of them match, it returns true
 * @param {*} searchMap
 * @param {function} comparer You can use Objects.isEquivalent
 */
function whereAny(searchMap, comparer) {
	return function (element) {
		let success = false
		let i, k
		const keys = Object.keys(searchMap)
		if (keys.length === 0) {
			// Nothing to search, so any object matches
			return true
		}
		for (i in keys) {
			k = keys[i]
			success |= element && searchMap && comparer(element[k], searchMap[k])
		}
		return success
	}
}

function sortObjectByKeyRecursive(object) {
	const sortedObj = {}
	const keys = Object.keys(object)

	keys.sort(function (key1, key2) {
		key1 = key1.toLowerCase()
		key2 = key2.toLowerCase()
		if (key1 < key2) return -1
		if (key1 > key2) return 1
		return 0
	})

	for (const index in keys) {
		const key = keys[index]
		if (typeof object[key] === 'object' && !(object[key] instanceof Array)) {
			sortedObj[key] = sortObjectByKeyRecursive(object[key])
		} else {
			sortedObj[key] = object[key]
		}
	}

	return sortedObj
}

function sortBy(property) {
	let sortOrder = 1
	if (property[0] === '-') {
		sortOrder = -1
		property = property.substr(1)
	}
	return function (a, b) {
		const result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
		return result * sortOrder
	}
}

/**
 * @constructor
 * @param {object} key
 * @param {object} value
 */
function Entry(key, value) {
	this.key = key
	this.value = value
}

/**
 * @returns {Entry[]}
 */
function entries() {
	return []
}

/**
 * @constructor
 */
function EntryList() {
	this.entries = entries()
}

/**
 * @param {object} key
 * @param {object} [returnBag]
 */
EntryList.prototype.keyExists = function keyExists(key, returnBag) {
	return this.entries.some(entry => {
		const found = entry.key === key
		if (found && returnBag) returnBag.value = entry.value
		return found
	})
}

/**
 * @param {object} value
 * @param {object} [returnBag]
 */
EntryList.prototype.valueExists = function valueExists(value, returnBag) {
	return this.entries.some(entry => {
		const found = entry.value === value
		if (found && returnBag) returnBag.key = entry.key
		return found
	})
}

EntryList.prototype.add = function add(key, value) {
	this.entries.push(new Entry(key, value))
	return this
}

EntryList.prototype.addIfKeyNotExists = function addIfKeyNotExists(key, value) {
	if (!this.keyExists(key)) {
		this.add(key, value)
	}
	return this
}

/**
 * @returns {EntryList}
 */
function castToEntryList() {
	return arguments[0]
}

/**
 * @constructor
 * @param {[]} baseArrayOrStack
 */
function Stack(baseArrayOrStack) {
	this.baseArray = baseArrayOrStack &&
		Array.isArray(baseArrayOrStack.baseArray)
		? baseArrayOrStack.baseArray
		: (Array.isArray(baseArrayOrStack) ? baseArrayOrStack : [])
}

Stack.prototype.push = function push(item) {
	this.baseArray.push(item)
}

Stack.prototype.pop = function pop() {
	this.baseArray.pop()
}

Stack.prototype.peek = function peek() {
	return this.baseArray[this.baseArray.length - 1]
}

Stack.prototype.empty = function empty() {
	return !this.baseArray || this.baseArray.length === 0
}

Stack.prototype.toString = function toString() {
	return String(this.baseArray)
}

function arrayReplace(array, searchValue, replaceValue) {
	if (Array.isArray(array)) {
		const index = array.indexOf(searchValue)
		if (index !== -1) {
			array[index] = replaceValue
		}
	}
	return array
}

/**
 * @constructor
 * @param {Array} baseArray
 * @param {boolean} [isCopy]
 */
function Arrays(baseArray, isCopy) {
	if (isCopy) {
		this.baseArray = forceArray(baseArray).slice()
	} else {
		this.baseArray = forceArray(baseArray)
	}
}

Arrays.prototype.isEmpty = function isEmpty() {
	return this.baseArray.length <= 0
}

Arrays.prototype.notEmpty = function notEmpty() {
	return !this.isEmpty()
}

Arrays.prototype.toString = function toString(replacerFn, tabSize) {
	return JSON.stringify(this.baseArray, replacerFn, tabSize)
}

Arrays.prototype.replace = function replace(searchValue, replaceValue) {
	return arrayReplace(this.baseArray, searchValue, replaceValue)
}

Arrays.prototype.contains = function contains(searchValue) {
	return this.baseArray.indexOf(searchValue) !== -1
}

Arrays.prototype.pushAndPeek = function pushAndPeek(newValue) {
	this.baseArray.push(newValue)
	return newValue
}

/**
 * @param {object} newValue
 * @param {number} index
 */
Arrays.prototype.setAndLoad = function setAndLoad(newValue, index) {
	this.baseArray[index] = newValue
	return this.baseArray
}

Arrays.prototype.wrap = function wrap(propName) {
	return this.baseArray.map(item => {
		const wrapper = {}
		wrapper[propName] = item
		return wrapper
	})
}

Arrays.prototype.map = function map(callback) {
	return this.baseArray.map(callback)
}

/**
 * @param {(mappedValue:never,index:number,array:never[])=>never} filterExpr
 * @param {(value:never,index:number,array:never[])=>never} mapExpr
 */
Arrays.prototype.filteredMap = function filteredMap(filterExpr, mapExpr) {
	return this.baseArray.map(mapExpr).filter(filterExpr)
}

Arrays.prototype.forEach = function forEach(callback) {
	return this.baseArray.forEach(callback)
}

Arrays.prototype.splice = function splice(startNumber, deleteCount) {
	return this.baseArray.splice(startNumber, deleteCount)
}

Arrays.prototype.forReverse = function forReverse(callback) {
	let index = this.baseArray.length - 1
	while (index >= 0) {
		callback(this.baseArray[index], index, this.baseArray)
		index -= 1
	}
}

Arrays.prototype.merge = function merge(_array1, _array2, _arrayN) {
	const self = this
	Array.prototype.slice.call(arguments).forEach(arrToMerge => Array.prototype.push.apply(self.baseArray, forceArray(arrToMerge)))
	return this.baseArray
}

Arrays.prototype.remove = function remove(searchValue) {
	const removed = fromArray([])
	const self = this
	if (Array.isArray(searchValue)) {
		searchValue.forEach(item => removed.merge(self.remove(item)))
	} else {
		const index = (typeof searchValue === 'function') ? searchValue(this.baseArray) : this.baseArray.indexOf(searchValue)
		if (index !== -1) {
			removed.merge(this.baseArray.splice(index, 1))
		}
	}
	return removed.baseArray
}

/**
 * Only works for serializable values
 */
Arrays.prototype.unique = function uniqueValues() {
	const valueMap = {}
	this.baseArray.forEach(item => {
		const key = JSON.stringify(item)
		valueMap[key] = item
	})
	return Object.keys(valueMap).map(key => valueMap[key])
}

/**
 * Not optimized complexity, but works fine for few elements
 * @param {object} a
 * @param {object} b
 * @param {function} comparer You can use Objects.isEqual as comparer
 */
Arrays.prototype.equalSetArray = function equalSetArray(a, b, comparer) {
	return a.length === b.length &&
		a.every(
			eleA => b.filter(
				eleB => comparer(eleA, eleB)
			).length === a.filter(
				eleC => comparer(eleA, eleC)
			).length
		)
}

/**
 * Sorts a copy of the baseArray by an specific array of indexes (the same property on all objects on array)
 * @param {String[]} indexList i.e. id list.
 * @param {String} indexProperty property name, i.e. "data.id" or "_id"
 * @returns {String[]}
 */
Arrays.prototype.sortByIndexList = function sortByIndexList(indexList, indexProperty) {
	let i; let j; let len; let obj; const sortedArray = []
	const objectArray = this.baseArray.slice() // copy
	for (i = 0, len = indexList.length; i < len && objectArray.length !== 0; i++) {
		for (j = 0; j < objectArray.length; j++) { // Performance improved with splice
			obj = objectArray[j]
			if (obj && (obj.data[indexProperty] || obj[indexProperty]) === indexList[i]) {
				sortedArray.push(objectArray.splice(j, 1)[0]) // Removes the matching and returns it, at same time
				break
			}
		}
	}
	return sortedArray.length !== 0 ? sortedArray : objectArray
}

Arrays.prototype.filter = function filter(filterCallback) {
	return this.baseArray.filter(filterCallback)
}

function fromArray(baseArray) {
	return new Arrays(baseArray, false)
}

function fromArrayCopy(baseArray) {
	return new Arrays(baseArray, true)
}

/**
 * Get different pagination for desktop and mobile
 * */
function paginationScreen(totalPages, i, pagination, paginationDots, pageIndex, mobile = false) {
	const totalPageItems = mobile ? 8 : 11
	const firstItems = mobile ? 5 : 8
	const lastItems = mobile ? 4 : 6
	const middleItems = mobile ? 1 : 3

	if (totalPages > totalPageItems) {
		if (!pageIndex || pageIndex < lastItems) {
			if (i < firstItems || i === totalPages - 1) {
				return pagination
			} else if (i === firstItems) {
				return paginationDots
			}
		} else if (pageIndex > totalPages - (lastItems + 1)) {
			if (i > totalPages - (firstItems + 1) || i === 0) {
				return pagination
			} else if (i === totalPages - (firstItems + 1)) {
				return paginationDots
			}
		} else {
			if (i === 0 || i === totalPages - 1 || (pageIndex >= i - middleItems && pageIndex <= i + middleItems)) {
				return pagination
			} else if (i === 1 || i === totalPages - 2) {
				return paginationDots
			}
		}
	} else {
		return pagination
	}
}

function removeDuplicates(arr, property) {
	const uniqueProperties = []
	return arr.filter(element => {
		const isDuplicate = uniqueProperties.indexOf(element[property]) !== -1
		if (!isDuplicate) {
			uniqueProperties.push(element[property])
			return true
		}
		return false
	})
}
