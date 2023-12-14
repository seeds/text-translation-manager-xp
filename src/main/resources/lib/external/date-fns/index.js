const dateFns = require('/lib/external/date-fns/date-fns')

const MyPortal = require('/lib/extension/portal')

/* Extend original dateFns module */

// Storing original functions
dateFns._parse = dateFns._parse || dateFns.parse
dateFns._format = dateFns._format || dateFns.format

dateFns.parse = tryParse
dateFns.format = tryFormat

const invalidDate = 'Invalid Date'

/**
 * Map of constants by locale
 */
const localeConstants = {
	en: {
		months3char: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		],
		monthsFull: [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		],
		weekdaysFull: [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		]
	},
	de: {
		months3char: [
			'Jan',
			'Feb',
			'Mär',
			'Apr',
			'Mai',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Okt',
			'Nov',
			'Dez'
		],
		monthsFull: [
			'Januar',
			'Februar',
			'Marsch',
			'April',
			'Kann',
			'Juni',
			'Juli',
			'August',
			'September',
			'Oktober',
			'November',
			'Dezember',
		],
		weekdaysFull: [
			'Sonntag',
			'Montag',
			'Dienstag',
			'Mittwoch',
			'Donnerstag',
			'Freitag',
			'Samstag'
		]
	},
	no: {
		months3char: [
			'jan',
			'feb',
			'mar',
			'apr',
			'mai',
			'jun',
			'jul',
			'aug',
			'sep',
			'okt',
			'nov',
			'des'
		],
		monthsFull: [
			'Januar',
			'Februar',
			'Mars',
			'April',
			'Mai',
			'Juni',
			'Juli',
			'August',
			'September',
			'Oktober',
			'November',
			'Desember',
		],
		weekdaysFull: [
			'Søndag',
			'Mandag',
			'Tirsdag',
			'Onsdag',
			'Torsdag',
			'Fredag',
			'Lørdag'
		]
	}
}

function formatLocale(date, locale) {
	if (date) {
		if (locale === 'no') {
			date = formatMonthFullLocale(date, locale)
			date = formatMonthLocale(date, locale)
			date = formatWeewdayLocale(date, locale)
		}
	}
	return date
}

function formatMonthLocale (date, locale) {
	if (date) {
		if (locale === 'no') {
			(localeConstants.en.months3char || []).forEach((month, idx) => {
				date = date.replace(month, localeConstants.no.months3char[idx])
			})
		}
	}
	return date
}

function formatMonthFullLocale (date, locale) {
	if (date) {
		if (locale === 'no') {
			(localeConstants.en.monthsFull || []).forEach((month, idx) => {
				date = date.replace(month, localeConstants.no.monthsFull[idx])
			})
		}
	}
	return date
}

function formatWeewdayLocale(date, locale) {
	if (date) {
		if (locale === 'no') {
			(localeConstants.en.weekdaysFull || []).forEach((week, idx) => {
				date = date.replace(week, localeConstants.no.weekdaysFull[idx])
			})
		}
	}
	return date
}

/**
 * Gets the day of week as English capitalized string.
 * @returns String
 */
function getWeekDay (weekNumber, lang) {
	let result = ''
	if ((typeof weekNumber !== 'number') || weekNumber < 0 || weekNumber > 6) { return result }
	lang = lang || ''
	switch (lang) {
		case 'de':
			result = localeConstants[lang].weekdaysFull[weekNumber] || ''
			break
		case 'en':
		default:
			result = localeConstants.en.weekdaysFull[weekNumber] || ''
			break
	}
	return result
}

/**
 * Check if datetimeBase is after or equal to datetimeTarget, in matters of time
 */
function isAfterOrEqual (datetimeBase, datetimeTarget) {
	return dateFns.isAfter(datetimeBase, datetimeTarget) || dateFns.isEqual(datetimeBase, datetimeTarget)
}

/**
 * Check if datetimeBase is before or equal to datetimeTarget, in matters of time
 */
function isBeforeOrEqual (datetimeBase, datetimeTarget) {
	return dateFns.isBefore(datetimeBase, datetimeTarget) || dateFns.isEqual(datetimeBase, datetimeTarget)
}

/**
 * Parses the date without time.
 * @returns Date
 */
function parseDate (datetimeString) {
	if (!datetimeString) { return dateFns.startOfToday() }
	return dateFns.startOfDay(tryParse(datetimeString))
}

function calculateISODate (datetimeRaw) {
	const datetimeParsed = tryParse(datetimeRaw)
	return new Date(datetimeParsed.valueOf() + datetimeParsed.getTimezoneOffset() * 60 * 1000)
}

/**
 * Formats the datetime string in another format
 * @returns String
 */
function formatString (datetimeString, newFormat, options) {
	let formattedDate
	if (!datetimeString) {
		formattedDate = invalidDate
	} else {
		const parsedDate = tryParse(datetimeString)
		formattedDate = tryFormat(parsedDate, newFormat, options)
	}
	return formattedDate
}

function clone (source) {
	let copiedDate
	if (!isNaN(source) && source !== null && source != undefined) {
		copiedDate = new Date(source.getTime())
	}
	return copiedDate
}

/**
 * Parsing with validation
 * @param {String} datetimeString
 */
function tryParse (datetimeString) {
	const parsed = dateFns._parse(datetimeString)
	if (isNaN(parsed)) {
		throw Error(invalidDate + ': "' + datetimeString + '"')
	}
	return parsed
}

/**
 * Formatting with validation
 * @param {Date} datetime
 * @param {String} formatStr
 * @param {} options
 */
function tryFormat (datetime, formatStr, options) {
	let formatted
	if (!datetime) {
		formatted = invalidDate
	} else {
		try {
			formatted = dateFns._format(datetime, formatStr, options)
		} catch (e) {
			formatted = invalidDate
		}
	}

	return formatted
}

/**
 * Internal function that swap array values to object keys, that now points to an integer with the array index
 * @param {Array} stringArray
 */
function valueToKey (stringArray) {
	const obj = {}
	for (let i = 0, len = stringArray.length; i < len; i++) {
		obj[stringArray[i]] = i
	}
	return obj
}

function zeroPad (base, targetLength, padString) {
	targetLength = targetLength || 2
	padString = padString || '0'
	targetLength = targetLength >> 0 // truncate if number or convert non-number to 0;
	padString = String((typeof padString !== 'undefined' ? padString : ' '))
	if (base.length > targetLength) {
		return String(base)
	} else {
		targetLength = targetLength - base.length
		if (targetLength > padString.length) {
			padString += padString.repeat(targetLength / padString.length) // append to original to ensure we are longer than needed
		}
		return padString.slice(0, targetLength) + String(base)
	}
}

function format(date, formatString) {
	const language = MyPortal.getSiteLanguage()

	return formatLocale(dateFns.format(date, formatString), language)
}

/** Re-export the new dateFns */

module.exports = {
	/* Original functions */
	addDays: dateFns.addDays,
	addHours: dateFns.addHours,
	addISOYears: dateFns.addISOYears,
	addMilliseconds: dateFns.addMilliseconds,
	addMinutes: dateFns.addMinutes,
	addMonths: dateFns.addMonths,
	addQuarters: dateFns.addQuarters,
	addSeconds: dateFns.addSeconds,
	addWeeks: dateFns.addWeeks,
	addYears: dateFns.addYears,
	areRangesOverlapping: dateFns.areRangesOverlapping,
	buildFormattingTokensRegExp: dateFns.buildFormattingTokensRegExp,
	closestIndexTo: dateFns.closestIndexTo,
	closestTo: dateFns.closestTo,
	compareAsc: dateFns.compareAsc,
	compareDesc: dateFns.compareDesc,
	differenceInCalendarDays: dateFns.differenceInCalendarDays,
	differenceInCalendarISOWeeks: dateFns.differenceInCalendarISOWeeks,
	differenceInCalendarISOYears: dateFns.differenceInCalendarISOYears,
	differenceInCalendarMonths: dateFns.differenceInCalendarMonths,
	differenceInCalendarQuarters: dateFns.differenceInCalendarQuarters,
	differenceInCalendarWeeks: dateFns.differenceInCalendarWeeks,
	differenceInCalendarYears: dateFns.differenceInCalendarYears,
	differenceInDays: dateFns.differenceInDays,
	differenceInHours: dateFns.differenceInHours,
	differenceInISOYears: dateFns.differenceInISOYears,
	differenceInMilliseconds: dateFns.differenceInMilliseconds,
	differenceInMinutes: dateFns.differenceInMinutes,
	differenceInMonths: dateFns.differenceInMonths,
	differenceInQuarters: dateFns.differenceInQuarters,
	differenceInSeconds: dateFns.differenceInSeconds,
	differenceInWeeks: dateFns.differenceInWeeks,
	differenceInYears: dateFns.differenceInYears,
	distanceInWords: dateFns.distanceInWords,
	distanceInWordsStrict: dateFns.distanceInWordsStrict,
	distanceInWordsToNow: dateFns.distanceInWordsToNow,
	eachDay: dateFns.eachDay,
	endOfDay: dateFns.endOfDay,
	endOfHour: dateFns.endOfHour,
	endOfISOWeek: dateFns.endOfISOWeek,
	endOfISOYear: dateFns.endOfISOYear,
	endOfMinute: dateFns.endOfMinute,
	endOfMonth: dateFns.endOfMonth,
	endOfQuarter: dateFns.endOfQuarter,
	endOfSecond: dateFns.endOfSecond,
	endOfToday: dateFns.endOfToday,
	endOfTomorrow: dateFns.endOfTomorrow,
	endOfWeek: dateFns.endOfWeek,
	endOfYear: dateFns.endOfYear,
	endOfYesterday: dateFns.endOfYesterday,
	format: format,
	getDate: dateFns.getDate,
	getDay: dateFns.getDay,
	getDayOfYear: dateFns.getDayOfYear,
	getDaysInMonth: dateFns.getDaysInMonth,
	getDaysInYear: dateFns.getDaysInYear,
	getHours: dateFns.getHours,
	getISODay: dateFns.getISODay,
	getISOWeek: dateFns.getISOWeek,
	getISOWeeksInYear: dateFns.getISOWeeksInYear,
	getISOYear: dateFns.getISOYear,
	getMilliseconds: dateFns.getMilliseconds,
	getMinutes: dateFns.getMinutes,
	getMonth: dateFns.getMonth,
	getOverlappingDaysInRanges: dateFns.getOverlappingDaysInRanges,
	getQuarter: dateFns.getQuarter,
	getSeconds: dateFns.getSeconds,
	getTime: dateFns.getTime,
	getYear: dateFns.getYear,
	isAfter: dateFns.isAfter,
	isBefore: dateFns.isBefore,
	isDate: dateFns.isDate,
	isEqual: dateFns.isEqual,
	isFirstDayOfMonth: dateFns.isFirstDayOfMonth,
	isFriday: dateFns.isFriday,
	isFuture: dateFns.isFuture,
	isLastDayOfMonth: dateFns.isLastDayOfMonth,
	isLeapYear: dateFns.isLeapYear,
	isMonday: dateFns.isMonday,
	isPast: dateFns.isPast,
	isSameDay: dateFns.isSameDay,
	isSameHour: dateFns.isSameHour,
	isSameISOWeek: dateFns.isSameISOWeek,
	isSameISOYear: dateFns.isSameISOYear,
	isSameMinute: dateFns.isSameMinute,
	isSameMonth: dateFns.isSameMonth,
	isSameQuarter: dateFns.isSameQuarter,
	isSameSecond: dateFns.isSameSecond,
	isSameWeek: dateFns.isSameWeek,
	isSameYear: dateFns.isSameYear,
	isSaturday: dateFns.isSaturday,
	isSunday: dateFns.isSunday,
	isThisHour: dateFns.isThisHour,
	isThisISOWeek: dateFns.isThisISOWeek,
	isThisISOYear: dateFns.isThisISOYear,
	isThisMinute: dateFns.isThisMinute,
	isThisMonth: dateFns.isThisMonth,
	isThisQuarter: dateFns.isThisQuarter,
	isThisSecond: dateFns.isThisSecond,
	isThisWeek: dateFns.isThisWeek,
	isThisYear: dateFns.isThisYear,
	isThursday: dateFns.isThursday,
	isToday: dateFns.isToday,
	isTomorrow: dateFns.isTomorrow,
	isTuesday: dateFns.isTuesday,
	isValid: dateFns.isValid,
	isWednesday: dateFns.isWednesday,
	isWeekend: dateFns.isWeekend,
	isWithinRange: dateFns.isWithinRange,
	isYesterday: dateFns.isYesterday,
	lastDayOfISOWeek: dateFns.lastDayOfISOWeek,
	lastDayOfISOYear: dateFns.lastDayOfISOYear,
	lastDayOfMonth: dateFns.lastDayOfMonth,
	lastDayOfQuarter: dateFns.lastDayOfQuarter,
	lastDayOfWeek: dateFns.lastDayOfWeek,
	lastDayOfYear: dateFns.lastDayOfYear,
	max: dateFns.max,
	min: dateFns.min,
	parse: dateFns.parse,
	setDate: dateFns.setDate,
	setDay: dateFns.setDay,
	setDayOfYear: dateFns.setDayOfYear,
	setHours: dateFns.setHours,
	setISODay: dateFns.setISODay,
	setISOWeek: dateFns.setISOWeek,
	setISOYear: dateFns.setISOYear,
	setMilliseconds: dateFns.setMilliseconds,
	setMinutes: dateFns.setMinutes,
	setMonth: dateFns.setMonth,
	setQuarter: dateFns.setQuarter,
	setSeconds: dateFns.setSeconds,
	setYear: dateFns.setYear,
	startOfDay: dateFns.startOfDay,
	startOfHour: dateFns.startOfHour,
	startOfISOWeek: dateFns.startOfISOWeek,
	startOfISOYear: dateFns.startOfISOYear,
	startOfMinute: dateFns.startOfMinute,
	startOfMonth: dateFns.startOfMonth,
	startOfQuarter: dateFns.startOfQuarter,
	startOfSecond: dateFns.startOfSecond,
	startOfToday: dateFns.startOfToday,
	startOfTomorrow: dateFns.startOfTomorrow,
	startOfWeek: dateFns.startOfWeek,
	startOfYear: dateFns.startOfYear,
	startOfYesterday: dateFns.startOfYesterday,
	subDays: dateFns.subDays,
	subHours: dateFns.subHours,
	subISOYears: dateFns.subISOYears,
	subMilliseconds: dateFns.subMilliseconds,
	subMinutes: dateFns.subMinutes,
	subMonths: dateFns.subMonths,
	subQuarters: dateFns.subQuarters,
	subSeconds: dateFns.subSeconds,
	subWeeks: dateFns.subWeeks,
	subYears: dateFns.subYears,
	/* New functions */
	getWeekDay: getWeekDay,
	isAfterOrEqual: isAfterOrEqual,
	isBeforeOrEqual: isBeforeOrEqual,
	parseDate: parseDate,
	formatString: formatString,
	clone: clone,
	calculateISODate: calculateISODate,
	formatMonthLocale: formatMonthLocale,
	formatWeewdayLocale: formatWeewdayLocale
}
