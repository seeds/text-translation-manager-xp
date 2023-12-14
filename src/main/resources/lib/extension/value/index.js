'use strict'

const Collections = require('/lib/util/collections')
const Primitives = require('/lib/util/primitives')
const Strings = require('/lib/util/strings')
const Extra = require('/lib/util/extra')
const Value = require('/lib/xp/value')
// eslint-disable-next-line no-var
var java = {
	lang: {
		Long: Java.type('java.lang.Long'),
		Double: Java.type('java.lang.Double'),
		Boolean: Java.type('java.lang.Boolean')
	},
	time: {
		Instant: Java.type('java.time.Instant'),
		LocalDate: Java.type('java.time.LocalDate'),
		LocalDateTime: Java.type('java.time.LocalDateTime'),
		LocalTime: Java.type('java.time.LocalTime')
	}
}

// eslint-disable-next-line no-var
var com = {
	enonic: {
		xp: {
			util: {
				BinaryReference: Java.type('com.enonic.xp.util.BinaryReference'),
				GeoPoint: Java.type('com.enonic.xp.util.GeoPoint'),
				Reference: Java.type('com.enonic.xp.util.Reference')
			},
			node: {
				BinaryAttachment: Java.type('com.enonic.xp.node.BinaryAttachment')
			}
		}
	}
}
const EntryList = Collections.EntryList

module.exports = {
	nodePropertyFixValueType
}

function nodePropertyFixValueType (rootObject) {
	const valueCache = new EntryList()
	return fixValueType(rootObject, valueCache)
}

/**
 * @param {object} nodeObject
 * @param {object} valueCacheObj
 */
function fixValueType (nodeObject, valueCacheObj) {
	const valueCache = Collections.castToEntryList(valueCacheObj)
	if (nodeObject === null || nodeObject === undefined) return null
	const returnBag = { value: null }
	if (valueCache.keyExists(nodeObject, returnBag)) return returnBag.value

	if (nodeObject instanceof java.lang.Boolean || nodeObject instanceof java.lang.Double ||
		nodeObject instanceof java.lang.Long || nodeObject instanceof java.time.Instant ||
		nodeObject instanceof java.time.LocalDate || nodeObject instanceof java.time.LocalTime ||
		nodeObject instanceof java.time.LocalDateTime || nodeObject instanceof com.enonic.xp.node.BinaryAttachment ||
		nodeObject instanceof com.enonic.xp.util.BinaryReference || nodeObject instanceof com.enonic.xp.util.GeoPoint ||
		nodeObject instanceof com.enonic.xp.util.Reference) {
		return nodeObject // Return as is
	}

	const type = typeof nodeObject.toISOString === 'function' ? 'date' : (Array.isArray(nodeObject) ? 'array' : typeof nodeObject)
	let result = null
	switch (type) {
		case 'date':
			result = Value.instant(nodeObject)
			valueCache.add(nodeObject, result)
			break
		case 'object':
		case 'array':
			result = type === 'array' ? [] : {}
			valueCache.add(nodeObject, result)
			for (const prop in nodeObject) {
				const fixedValue = fixValueType(nodeObject[prop], valueCache)
				valueCache.addIfKeyNotExists(nodeObject[prop], fixedValue)
				result[prop] = fixedValue
			}
			break
		case 'number':
			result = Primitives.isInteger(nodeObject) ? new java.lang.Long(nodeObject) : new java.lang.Double(nodeObject)
			valueCache.add(nodeObject, result)
			break
		case 'boolean':
			result = new java.lang.Boolean(nodeObject)
			valueCache.add(nodeObject, result)
			break
		case 'string':
			if (Strings.isValidUUID(nodeObject)) {
				result = Value.reference(nodeObject)
			} else if (Extra.isInstant(nodeObject)) {
				result = Value.instant(nodeObject)
			} else if (Extra.isLocalDateTime(nodeObject)) {
				result = Value.localDateTime(nodeObject)
			} else if (Extra.isLocalDate(nodeObject)) {
				result = Value.localDate(nodeObject)
			} else if (Extra.isLocalTime(nodeObject)) {
				result = Value.localTime(nodeObject)
			} else {
				result = String(nodeObject)
			}
			valueCache.add(nodeObject, result)
			break
		default:
			result = nodeObject
			valueCache.add(nodeObject, result)
	}
	return result
}
