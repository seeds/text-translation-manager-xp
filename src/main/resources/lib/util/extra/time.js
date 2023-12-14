'use strict'

const java = {
	time: {
		Instant: Java.type('java.time.Instant')
	},
	lang: {
		System: Java.type('java.lang.System')
	}
}

module.exports = {
	currentTimeMillis,
	isLocalTime,
	isLocalDate,
	isLocalDateTime,
	isInstant,
	removeExtraMillisecondsFromDateTime,
	toDateStringOrDefault
}

/**
 * The defaultValue only works for null "dirtyDate"
 * @param {Date} dirtyDate
 * @param {string} defaultValue
 * @returns {string}
 */
function toDateStringOrDefault (dirtyDate, defaultValue) {
	if (dirtyDate === undefined) return new Date().toISOString()

	const defaultDateStr = defaultValue === undefined ? null : defaultValue
	return dirtyDate !== null ? new Date(removeExtraMillisecondsFromDateTime(dirtyDate)).toISOString() : defaultDateStr
}

function currentTimeMillis () {
	return java.lang.System.currentTimeMillis()
}

function removeExtraMillisecondsFromDateTime (dataString) {
	if (typeof dataString === 'string' && dataString.length > 23) {
		dataString = `${dataString.substring(0, 23)}Z`
	}
	return dataString
}

function isLocalDate (dirtyDate) {
	if (typeof dirtyDate !== 'string') return false
	const strDate = String(dirtyDate)
	const matchResult = strDate.match(/^(\d{4}-\d{2}-\d{2})$/)
	return !!(matchResult && matchResult.length)
}

function isLocalTime (dirtyTime) {
	if (typeof dirtyTime !== 'string') return false
	const strTime = String(dirtyTime)
	const matchResult = strTime.match(/^(\d{2}:\d{2}|\d{2}:\d{2}:\d{2}|\d{2}:\d{2}:\d{2}\.\d{1,9})$/)
	return !!(matchResult && matchResult.length)
}

function isLocalDateTime (dirtyDateTime) {
	if (typeof dirtyDateTime !== 'string') return false
	const strDateTime = String(dirtyDateTime)
	const dateTimeParts = strDateTime.split('T')
	const firstPartIsLocalDate = isLocalDate(dateTimeParts[0])
	const secondPartIsLocalTime = isLocalTime(dateTimeParts[1])
	return !!(firstPartIsLocalDate && secondPartIsLocalTime)
}

function isInstant (dirtyInstant) {
	if (dirtyInstant && typeof dirtyInstant.toISOString === 'function') return true
	if (typeof dirtyInstant !== 'string') return false
	const strInstant = String(dirtyInstant)
	const dateTimeParts = strInstant.split('T')
	const timeWithZone = dateTimeParts[1]
	if (typeof timeWithZone !== 'string') return false // Must have the time part
	const firstPartIsDate = isLocalDate(dateTimeParts[0])
	const timeWithoutZone = timeWithZone.replace(/(Z|[+-](0|[1-9][0-9]?|\d{2}:\d{2}))$/, '')
	if (timeWithoutZone.length === timeWithZone.length) return false // Time must have zone
	const secondPartIsLocalTime = isLocalTime(timeWithoutZone)
	return !!(firstPartIsDate && secondPartIsLocalTime)
}
