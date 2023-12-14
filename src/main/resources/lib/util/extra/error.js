'use strict'

const com = {
	google: {
		common: {
			base: {
				Throwables: Java.type('com.google.common.base.Throwables')
			}
		}
	}
}

module.exports = {
	formatErrorStackTrace: formatErrorStackTrace,
	formatErrorMessage: formatErrorMessage,
	wrapErrorForRethrow: wrapErrorForRethrow
}

function formatErrorStackTrace (origException) {
	let exceptionString = ''
	// 1) Try get exception string using java
	if (!exceptionString) {
		try {
			exceptionString = com.google.common.base.Throwables.getStackTraceAsString(origException)
		} catch (e) {
			// Do nothing
		}
	}
	// 2) Try get exception string using nashorn extended properties
	if (!exceptionString) {
		try {
			const stack = origException.stack.toString().trim()
			const fileName = isNotNull(origException.fileName) ? String(origException.fileName).trim() : ''
			const lineNumber = isNotNull(origException.lineNumber) ? String(origException.lineNumber).trim() : ''
			exceptionString = fileName && lineNumber && stack ? fileName + ':' + lineNumber + '\n' + stack : stack
		} catch (e) {
			// Do nothing
		}
	}
	// 3) Try get exception string using safeStringify
	if (!exceptionString) {
		try {
			exceptionString = safeStringify(origException, null, 2)
			if (exceptionString === '{}' || exceptionString === '[]') {
				exceptionString = ''
			}
		} catch (e) {
			// Do nothing
		}
	}
	// 4) Try get exception string using toString
	if (!exceptionString) {
		try {
			exceptionString = origException.toString()
		} catch (e) {
			// Otherwise, empty string
			exceptionString = String(origException)
		}
	}

	return exceptionString
}

function formatErrorMessage (errorObject, optionalFileName, optionalLineNumber) {
	const fileAndLine = (optionalFileName ? optionalFileName + ':' : '') + (errorObject.lineNumber || optionalLineNumber)
	const errMsg = errorObject.cause ? (fileAndLine + ' - ' + errorObject.cause.message) : (fileAndLine + ' - ' + errorObject.message)
	return errMsg
}

function wrapErrorForRethrow (errorObject) {
	const errorWrapper = new Error()
	errorWrapper.isReported = true
	errorWrapper.cause = errorObject
	return errorWrapper
}

function safeStringify (source, handler, tabs) {
	let result
	try {
		result = JSON.stringify(source, handler, tabs)
	} catch (e) {
		result = ''
	}
	return result
}

function isNotNull (val) {
	return val !== null && val !== undefined
}
