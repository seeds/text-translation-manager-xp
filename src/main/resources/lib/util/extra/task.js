'use strict'

const Task = require('/lib/xp/task')
const Strings = require('/lib/util/strings')
const Primitives = require('/lib/util/primitives')

module.exports = (taskName, isSilent) => new TaskUtil(taskName, isSilent)

/**
 * @constructor
 * @param {string} taskName
 * @param {boolean} isSilent
 * @returns {TaskUtil}
 */
function TaskUtil (taskName, isSilent) {
	this.taskName = taskName
	this.id = taskName // Temporary id
	this.isVerbose = !isSilent
}

/**
 * @param {object} dataOrMsg
 * @param {string} [dataOrMsg.info]
 * @param {number} [dataOrMsg.current]
 * @param {number} [dataOrMsg.total]
 * @param {string} announceType
 * @returns {string}
 */
TaskUtil.prototype.announce = function announce (dataOrMsg, announceType) {
	const announceTypeStr = Strings.toStringOrDefault(announceType, '').toLowerCase()
	const msgStr = typeof dataOrMsg === 'string' ? String(dataOrMsg) : Strings.toStringOrDefault(dataOrMsg.info, '')
	const currentStr = Strings.toStringOrDefault(dataOrMsg.current, '')
	const totalStr = Strings.toStringOrDefault(dataOrMsg.total, '')
	const msg = msgStr.replace(/{{taskName}}/g, this.taskName)
		.replace(/{{current}}/g, currentStr)
		.replace(/{{total}}/g, totalStr)
	switch (announceTypeStr) {
		case 'signal': {
			const signalMsg = '[SIGNAL] ' + msg
			if (this.isVerbose) log.warning(signalMsg)
			Task.progress({
				info: signalMsg,
				current: Primitives.parseIntOrDefault(currentStr, null),
				total: Primitives.parseIntOrDefault(totalStr, null)
			})
			break
		}
		case 'warn':
		case 'warning': {
			const signalMsg = '[WARN] ' + msg
			if (this.isVerbose) log.warning(signalMsg)
			Task.progress({
				info: signalMsg,
				current: Primitives.parseIntOrDefault(currentStr, null),
				total: Primitives.parseIntOrDefault(totalStr, null)
			})
			break
		}
		case 'fatal':
		case 'error': {
			const signalMsg = '[ERROR] ' + msg
			if (this.isVerbose) log.error(signalMsg)
			Task.progress({
				info: signalMsg,
				current: Primitives.parseIntOrDefault(currentStr, null),
				total: Primitives.parseIntOrDefault(totalStr, null)
			})
			break
		}
		default: {
			const signalMsg = '[INFO] ' + msg
			if (this.isVerbose) log.info(signalMsg)
			Task.progress({
				info: signalMsg,
				current: Primitives.parseIntOrDefault(currentStr, null),
				total: Primitives.parseIntOrDefault(totalStr, null)
			})
		}
	}
	return msg
}

/**
 * @param {object} dataOrMsg
 * @param {string} [dataOrMsg.info]
 * @param {number} [dataOrMsg.current]
 * @param {number} [dataOrMsg.total]
 * @returns {string}
 */
TaskUtil.prototype.announceWarning = function announceWarning (dataOrMsg) {
	return this.announce(dataOrMsg, 'warning')
}

/**
 * @param {object} dataOrMsg
 * @param {string} [dataOrMsg.info]
 * @param {number} [dataOrMsg.current]
 * @param {number} [dataOrMsg.total]
 * @returns {string}
 */
TaskUtil.prototype.announceSignal = function announceSignal (dataOrMsg) {
	return this.announce(dataOrMsg, 'signal')
}

/**
 * @param {object} dataOrMsg
 * @param {string} [dataOrMsg.info]
 * @param {number} [dataOrMsg.current]
 * @param {number} [dataOrMsg.total]
 * @returns {string}
 */
TaskUtil.prototype.announceError = function announceError (dataOrMsg) {
	return this.announce(dataOrMsg, 'error')
}

/**
 * @param {boolean} keepSignalAfterRead
 */
TaskUtil.prototype.anyStopSignalReceived = function anyStopSignalReceived (keepSignalAfterRead) {
	let anyStopSignal = false
	if (app.taskSignal) {
		const taskSignal = app.taskSignal[this.taskName] || ''
		if (!keepSignalAfterRead) {
			app.taskSignal[this.taskName] = null // Clear signal already received
		}
		anyStopSignal = taskSignal === 'stop'
	}
	return anyStopSignal
}

/**
 * @param {function|object} configOrFunc
 */
TaskUtil.prototype.start = function start (configOrFunc) {
	if (typeof configOrFunc === 'function') {
		const taskId = Task.submit({
			description: this.taskName,
			task: configOrFunc
		})
		this.id = taskId
		return taskId
	} else {
		return Task.submitNamed({
			name: this.taskName,
			config: configOrFunc
		})
	}
}

TaskUtil.prototype.stop = function stop () {
	app.taskSignal = app.taskSignal || {}
	app.taskSignal[this.taskName] = 'stop'
}

/**
 * @param {boolean} simpleCheck
 */
TaskUtil.prototype.check = function check (simpleCheck) {
	const self = this
	// eslint-disable-next-line no-extra-parens
	const taskDetails = this.id === this.taskName ? (() => Task.list({ name: self.taskName })) : (() => Task.get(self.id))
	return {
		taskIsRunning: Task.isRunning(this.id),
		status: !simpleCheck ? taskDetails() : {}
	}
}

TaskUtil.prototype.sleep = Task.sleep
