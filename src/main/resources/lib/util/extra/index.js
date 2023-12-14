'use strict'

const Time = require('/lib/util/extra/time')
const ExtraError = require('/lib/util/extra/error')

module.exports = {
	currentTimeMillis: Time.currentTimeMillis,
	isInstant: Time.isInstant,
	isLocalDate: Time.isLocalDate,
	isLocalDateTime: Time.isLocalDateTime,
	isLocalTime: Time.isLocalTime,
	removeExtraMillisecondsFromDateTime: Time.removeExtraMillisecondsFromDateTime,
	formatErrorMessage: ExtraError.formatErrorMessage,
	formatErrorStackTrace: ExtraError.formatErrorStackTrace,
	tryRepeatedly,
	tryAndRetry,
	wait
}

function handleError (onError, message) {
	if (typeof onError === 'function') {
		onError(message)
	} else {
		log.error(message)
	}
}

function tryRepeatedly (callback, onError, attempts = 1) {
	let result
	if (typeof callback === 'function') {
		while (attempts > 0) {
			try {
				result = callback()
				attempts = 0
			} catch (e) {
				handleError(onError, e.message)
				attempts -= 1
			}
		}
	}
	return result
}

function wait (milliseconds) {
	let now = Date.now()
	const limit = now + milliseconds
	while (now <= limit) {
		now = Date.now()
	}
}

/**
 * Retry the function while there are any failure
 * @param {*} callback Function that may fail
 * @param {*} callbackIsFailure Function that tests the first function result
 * @param {*} nTimes Number of retries
 * @param {*} nDelay Milliseconds to wait between retries
 * @param {function} customDelayWaitFn Custom function that make the execution wait
 * @param
 */
function tryAndRetry (callback, callbackIsFailure, nTimes, nDelay, customDelayWaitFn) {
	let result, failure, currErrorMsg, currExceptionMsg
	let lastErrorMsg = ''
	let lastExceptionMsg = ''
	const fnWait = typeof customDelayWaitFn === 'function' ? customDelayWaitFn : wait
	for (let i = 1; i <= (nTimes || 1); i++) {
		try {
			result = callback()

			if ((failure = callbackIsFailure(result))) {
				currErrorMsg = typeof failure === 'string' ? failure : JSON.stringify(failure)
				if (currErrorMsg !== lastErrorMsg) {
					lastErrorMsg = currErrorMsg
					log.error('tryAndRetry =>\n' + lastErrorMsg + '\n')
				}
				fnWait(nDelay || 0)
			} else {
				break
			}
		} catch (e) {
			currExceptionMsg = 'Exception while invoking tryAndRetry(callback, callbackIsFailure, nTimes, nDelay, customDelayWaitFn) =>\n' + ExtraError.formatErrorStackTrace(e)
			if (currExceptionMsg !== lastExceptionMsg) {
				lastExceptionMsg = currExceptionMsg
				log.error(lastExceptionMsg)
			}
			fnWait(nDelay || 0)
		}
	}
	return result
}
