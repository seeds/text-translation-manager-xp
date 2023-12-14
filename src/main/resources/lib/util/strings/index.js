'use strict'

const Portal = require('/lib/xp/portal')
const I18n = require('/lib/xp/i18n')
const UtilConstants = require('/lib/util/constants')
const number = UtilConstants.number

var org = {
	json: {
		XML: Java.type('org.json.XML')
	}
}


module.exports = {
	stripInvalidQueryChars: stripInvalidQueryChars,
	translate,
	formatFileSize,
	forceHttp,
	removeFileExtension,
	parseContentPath,
	unParseContentPath,
	getFileNameFromURL,
	parseBrTag,
	unParseBrTag,
	stripHtml,
	randomStr,
	getParentPath,
	getNameFromPath,
	buildScriptTag,
	buildStyleSheetTag,
	unparseChars,
	beforeComma,
	removeLabel,
	removeLeadingAndTrailingChar,
	toStringOrDefault,
	requestParamsToQueryString,
	fromString,
	isBlankOrEmpty,
	isValidUUID,
	parseParams,
	createResults,
	getDomainFomUrl,
	adjustLinks,
	getFieldValue,
	cleanEncode,
	convertXmlToJsonString,
	slugify,
	isNumeric,
	getTextBetweenFirstParenthesis,
	limit
}

/**
 * @param {string} xmlString
 * @returns {string} jsonString
 */
function convertXmlToJsonString (xmlString) {
	return org.json.XML.toJSONObject(xmlString).toString(2)
}


function cleanEncode (str) {
	if (!str) {
		return null
	}

	return decodeURIComponent(encodeURIComponent(str).replace(/\%C2\%AD/g, ''))
}

function isBlankOrEmpty (obj, trueCallback, falseCallback) {
	if (obj === null || obj === undefined || !String(obj).trim()) {
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

function isValidUUID (str) {
	const regex = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
	return regex.test(str)
}

function stripInvalidQueryChars (queryString) {
	let cleanQuery = queryString.replace(/&&|\|\|/gi, ' ') // Replace operation tokens
	cleanQuery = cleanQuery.replace(/[+|\-*()"'{}[\]^?:\\]/gi, ' ') // Replace special characters
	cleanQuery = cleanQuery.replace(/\s+/gi, ' ') // Replace all whitespaces with plain spaces
	return cleanQuery
}

function translate (key, params) {
	const site = Portal.getSite() || {}
	let language
	if (site.language) {
		language = site.language.split('_')[0]
	} else {
		language = 'no'
	}
	let localize = I18n.localize({ key: key, locale: language })
	if (params) {
		const keys = Object.keys(params)
		for (let i = 0; i < keys.length; i++) {
			const regex = new RegExp(`\<\<${keys[i]}\>\>`, 'g')
			localize = localize.replace(regex, params[keys[i]])
		}
	}
	return localize
}

function formatFileSize (bytes, dm = 1) {
	if (bytes === 0) return '0B'
	const k = 1000
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString() + ' ' + sizes[i]
}

function forceHttp (url) {
	return url.startsWith('https://') ? `http://${url.split('https://')[1]}` : url
}

function removeFileExtension (fileName) {
	return fileName.replace(/\.[^/.]+$/, '')
}

function parseContentPath (_path) {
	return _path.startsWith('/content') ? _path : `/content${_path}`
}

function unParseContentPath (_path) {
	return _path.startsWith('/content') ? `${_path.split('/content')[1]}` : _path
}

function getFileNameFromURL (url) {
	return url.split('/').slice(-1)[0]
}

function parseBrTag (str) {
	return str && str.replace(/<br \/>|<br\/>|<br>/gi, '\n')
}

function unParseBrTag (str) {
	return str && str.replace(/\n/g, '<br>')
}

function stripHtml (dirtyStr) {
	return dirtyStr && dirtyStr.replace(/(<([^>]+)>)/gi, '')
}

function randomStr (len, arr) {
	let ans = ''
	for (let i = len; i > 0; i--) {
		ans += arr[Math.floor(Math.random() * arr.length)]
	}
	return ans
}

function getParentPath (_path) {
	return (_path && _path.replace(/\/$/, '').split('/').slice(0, -1).join('/')) || '/'
}

function getNameFromPath (contentPath) {
	const path = contentPath || ''
	const pathIdParts = path.split('/')
	return pathIdParts[pathIdParts.length - 1] || pathIdParts[pathIdParts.length - 2] || ''
}

function buildScriptTag (assetPath) {
	return `<script src="${Portal.assetUrl({ path: assetPath })}" ></script>`
}

function buildStyleSheetTag (assetPath) {
	return `<link rel="stylesheet" href="${Portal.assetUrl({ path: assetPath })}">`
}

function unparseChars (body) {
	if (!body) return
	body = body.replace(new RegExp('ø', 'g'), 'o')
	body = body.replace(new RegExp('&amp;oslash;', 'g'), 'ø')

	body = body.replace(new RegExp('Ø', 'g'), 'O')
	body = body.replace(new RegExp('&amp;Oslash;', 'g'), 'Ø')

	body = body.replace(new RegExp('Æ', 'g'), 'AE')
	body = body.replace(new RegExp('&amp;Aelig;', 'g'), 'AE')

	body = body.replace(new RegExp('&AElig;', 'g'), 'AE')
	body = body.replace(new RegExp('&amp;AElig;', 'g'), 'AE')

	body = body.replace(new RegExp('æ', 'g'), 'ae')
	body = body.replace(new RegExp('&amp;aelig;', 'g'), 'ae')

	body = body.replace(new RegExp('å', 'g'), 'a')
	body = body.replace(new RegExp('&amp;aring;', 'g'), 'a')

	body = body.replace(new RegExp('Å', 'g'), 'A')
	body = body.replace(new RegExp('&amp;Aring;', 'g'), 'Å')

	body = body.replace(new RegExp('Ä', 'g'), 'A')
	body = body.replace(new RegExp('&amp;Auml;', 'g'), 'Ä')

	body = body.replace(new RegExp('ä', 'g'), 'a')
	body = body.replace(new RegExp('&amp;auml;', 'g'), 'ä')

	body = body.replace(new RegExp('Ð', 'g'), 'ETH')
	body = body.replace(new RegExp('&amp;ETH;', 'g'), 'Ð')

	body = body.replace(new RegExp('ð', 'g'), 'eth')
	body = body.replace(new RegExp('&amp;eth;', 'g'), 'ð')

	body = body.replace(new RegExp('Ö', 'g'), 'O')
	body = body.replace(new RegExp('&amp;Ouml;', 'g'), 'Ö')

	body = body.replace(new RegExp('ö', 'g'), 'o')
	body = body.replace(new RegExp('&amp;ouml;', 'g'), 'ö')

	body = body.replace(new RegExp('Þ', 'g'), 'Þ')
	body = body.replace(new RegExp('&amp;THORN;', 'g'), 'Þ')

	body = body.replace(new RegExp('á', 'g'), 'a')
	body = body.replace(new RegExp('Á', 'g'), 'A')

	body = body.replace(new RegExp('é', 'g'), 'e')
	body = body.replace(new RegExp('É', 'g'), 'E')

	body = body.replace(new RegExp('í;', 'g'), 'i')
	body = body.replace(new RegExp('Í', 'g'), 'I')

	body = body.replace(new RegExp('ó', 'g'), 'o')
	body = body.replace(new RegExp('Ó', 'g'), 'O')

	body = body.replace(new RegExp('ú', 'g'), 'u')
	body = body.replace(new RegExp('Ú', 'g'), 'U')

	body = body.replace(new RegExp('à', 'g'), 'a')
	body = body.replace(new RegExp('À', 'g'), 'A')

	body = body.replace(new RegExp('è', 'g'), 'e')
	body = body.replace(new RegExp('È', 'g'), 'E')

	body = body.replace(new RegExp('ì', 'g'), 'i')
	body = body.replace(new RegExp('Ì', 'g'), 'I')

	body = body.replace(new RegExp('ò', 'g'), 'o')
	body = body.replace(new RegExp('Ò', 'g'), 'O')

	body = body.replace(new RegExp('ù', 'g'), 'u')
	body = body.replace(new RegExp('Ù', 'g'), 'U')

	body = body.replace(new RegExp('â', 'g'), 'a')
	body = body.replace(new RegExp('Â', 'g'), 'A')

	body = body.replace(new RegExp('ê', 'g'), 'e')
	body = body.replace(new RegExp('Ê', 'g'), 'E')

	body = body.replace(new RegExp('î', 'g'), 'i')
	body = body.replace(new RegExp('Î', 'g'), 'I')

	body = body.replace(new RegExp('ô', 'g'), 'o')
	body = body.replace(new RegExp('Ô', 'g'), 'O')

	body = body.replace(new RegExp('û', 'g'), 'u')
	body = body.replace(new RegExp('Û', 'g'), 'U')

	return body
}

function beforeComma (str) {
	return str && str.toString().split(',')[0]
}

function removeLabel (str, label) {
	if (str && str.toString()) {
		if (str.toString().split(':').length > 1) {
			if (label) {
				return str.toString().split(':')[0] === label ? str.toString().split(':').slice(1).join(':').trim() : str.toString()
			} else {
				return str.toString().split(':').slice(1).join(':').trim()
			}
		} else {
			return str.toString()
		}
	}
}

function removeLeadingAndTrailingChar (text, charToRemove) {
	let left = 0
	let right = text.length - 1
	const charCode = charToRemove.charCodeAt(0)
	while (text.charCodeAt(left) === charCode && ++left);
	while (text.charCodeAt(right) === charCode && --right);
	return text.slice(left, right + 1)
}

/**
 * @returns {String}
 */
function toStringOrDefault (strObj, defaultValue) {
	if (strObj === null || strObj === undefined) {
		return defaultValue
	}
	return (typeof strObj.toISOString === 'function') ? strObj.toISOString() : String(strObj)
}

function requestParamsToQueryString (requestParams) {
	const queryStringArray = []
	Object.keys(requestParams).forEach((key) => {
		const param = requestParams[key]
		queryStringArray.push(`${key}=` + (Array.isArray(param) ? param.join(`&${key}=`) : param))
	})
	return queryStringArray.join('&')
}

// "Strings" extension constructor
function Strings (baseString) {
	this.baseString = String(baseString)
}

Strings.prototype.toString = function toString () {
	return this.baseString
}

/**
 * @param {string} replaceFrom
 * @param {string} replaceTo
 * @return {string}
 */
Strings.prototype.replaceAllLiteral = function replaceAllLiteral (replaceFrom, replaceTo) {
	if (!this.baseString) return
	return this.baseString.split(replaceFrom).join(replaceTo)
}

/**
 * Split string without creating empty entries
 * @returns {string[]} String array
 */
Strings.prototype.splitClean = function splitClean () {
	if (!this.baseString) return
	const split = String.prototype.split
	return split.apply(this.baseString, arguments).filter(str => !isBlankOrEmpty(str))
}

Strings.prototype.startsWith = function startsWith (search, position) {
	const self = this
	if (!self.baseString) return false
	if (!Array.isArray(search)) {
		search = [search]
	}
	return search.some(value => {
		return Boolean(self.baseString.startsWith(value, position))
	})
}

/**
 * @returns {boolean}
 */
Strings.prototype.endsWith = function endsWith (search, thisLen) {
	const self = this
	if (!self.baseString) return false
	if (!Array.isArray(search)) {
		search = [search]
	}
	return search.some(value => {
		if (thisLen === undefined || thisLen > self.baseString.length) {
			thisLen = self.baseString.length
		}
		return self.baseString.substring(thisLen - value.length, thisLen) === value
	})
}

/**
 * @param {string|string[]} search
 * @param {boolean} isCaseInsensitive
 */
Strings.prototype.includes = function includes (search, isCaseInsensitive) {
	const self = this
	if (!self.baseString) return false
	if (!Array.isArray(search)) {
		search = [search]
	}
	const baseString = isCaseInsensitive ? self.baseString.toLowerCase() : self.baseString
	return search.some(value => {
		const valueSearch = isCaseInsensitive ? String(value).toLowerCase() : String(value)
		return baseString.indexOf(valueSearch) !== -1
	})
}

const RequireObjectCoercible = O => {
	if (O === null || typeof O === 'undefined') {
		throw new TypeError('"this" value must not be null or undefined')
	}
	return O
}
const MAX_SAFE_INTEGER = number.MAX_SAFE_INTEGER
const ToLength = argument => {
	const len = parseInt(argument)
	if (isNaN(len) || len <= 0) { return 0 }
	if (len > MAX_SAFE_INTEGER) { return MAX_SAFE_INTEGER }
	return len
}

Strings.prototype.padStart = function padStart (maxLength, fillString = ' ') {
	const O = RequireObjectCoercible(this)
	const S = String(O)
	const intMaxLength = ToLength(maxLength)
	const stringLength = ToLength(S.length)
	if (intMaxLength <= stringLength) { return S }
	let filler = typeof fillString === 'undefined' ? ' ' : String(fillString)
	if (filler === '') { return S }
	const fillLen = intMaxLength - stringLength
	while (filler.length < fillLen) {
		const fLen = filler.length
		const remainingCodeUnits = fillLen - fLen
		if (fLen > remainingCodeUnits) {
			filler += filler.slice(0, remainingCodeUnits)
		} else {
			filler += filler
		}
	}
	const truncatedStringFiller = filler.slice(0, fillLen)
	return truncatedStringFiller + S
}

Strings.prototype.padEnd = function padEnd (maxLength, fillString = ' ') {
	const O = RequireObjectCoercible(this)
	const S = String(O)
	const intMaxLength = ToLength(maxLength)
	const stringLength = ToLength(S.length)
	if (intMaxLength <= stringLength) { return S }
	let filler = typeof fillString === 'undefined' ? ' ' : String(fillString)
	if (filler === '') { return S }
	const fillLen = intMaxLength - stringLength
	while (filler.length < fillLen) {
		const fLen = filler.length
		const remainingCodeUnits = fillLen - fLen
		if (fLen > remainingCodeUnits) {
			filler += filler.slice(0, remainingCodeUnits)
		} else {
			filler += filler
		}
	}
	const truncatedStringFiller = filler.slice(0, fillLen)
	return S + truncatedStringFiller
}

function fromString (baseString) {
	return new Strings(baseString)
}

function parseParams (params) {
	const query = params.query
	let ids
	let start
	let count

	try {
		ids = (params.ids ? params.ids.split(',') : [])
	} catch (e) {
		// utilLib.log('Invalid parameter ids: %s, using []', params.ids, 'warning')
		log.info('Invalid parameter ids, using []')
		ids = []
	}

	try {
		start = Math.max(parseInt(params.start) || 0, 0)
	} catch (e) {
		// utilLib.log('Invalid parameter start: %s, using 0', params.start, 'warning')
		log.info('Invalid parameter start, using 0')
		start = 0
	}

	try {
		count = Math.max(parseInt(params.count) || 15, 0)
	} catch (e) {
		// utilLib.log('Invalid parameter count: %s, using 15', params.count, 'warning')
		log.info('Invalid parameter count, using 15')
		count = 15
	}

	return {
		query: query,
		ids: ids,
		start: start,
		end: start + count,
		count: count
	}
}

/**
 * Used to create a result from a sevice to a customSelect
 * @returns {Object}
 */
function createResults (items, params, fetchFn) {
	if (params && !params.query && params.ids) {
		return fetchFn
	} else {
		return items
	}
}

/**
 * return domain from a given Url
 * @param {string} fullUrl
 * @returns {string}
 */
function getDomainFomUrl (fullUrl) {
	const arr = fullUrl.split('/')
	return arr[0] + '//' + arr[2]
}

/**
 * return the real link of a content
 * @param {string} html
 * @returns {string}
 */
function adjustLinks (html) {
	const aTags = html.match(/<a(.*?)<\/a>/g) || []

	aTags.forEach(item => {
		const content = (/"content:\/\/(.*?)"/).exec(item)

		if (content && content.length === 2) {
			let link = Portal.pageUrl({ id: content[1] })
			if (!link || link.indexOf('404?message') >= 0) link = '#'

			html = html.replace(content[0], link)
		}
	})

	return html
}

/**
 * return value of a field in a content
 * @param {Object} content
 * @param {string} field
 * */
function getFieldValue (content, field) {
	if (!content) return undefined

	if (content.data && field in content.data) return content.data[field]
	else {
		const contentXData = (content.x && content.x[app.name]) || {}
		return contentXData.metadata && field in contentXData.metadata && contentXData.metadata[field]
	}
}

function slugify (str) {
	str = str.replace(/^\s+|\s+$/g, '')
	str = str.toLowerCase()

	const from = 'åæàáäâèéëêìíïîøòóöôùúüûñç·/_,:;'
	const to = 'aaaaaaeeeeiiiiooooouuuunc------'
	for (let i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
	}

	str = str.replace(/[^a-z0-9 -]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')

	return str
}

function isNumeric(value) {
	value = (value && value.toString()) || ''
    return /^-?\d+$/.test(value);
}

function getTextBetweenFirstParenthesis(str) {
	const regExp = /\(([^)]+)\)/g
	const match = str && str.match(regExp)
	return (match && match[0] && match[0].replace(/\(|\)/g, '')) || ''
}

function limit(text, count) {
	return (text && (text.length > count)) ? (text.substring(0, count) + '...') : text
}
