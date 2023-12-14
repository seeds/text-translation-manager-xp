'use strict'

const Auth = require('/lib/xp/auth')

module.exports = {
	isUnauthorized
}

function isUnauthorized () {
	if (!Auth.hasRole('system.admin') && !Auth.hasRole('system.admin.login')) {
		log.error(`UNAUTHORIZED =>\n${JSON.stringify(Auth.getUser(), null, 2)}`)
		return {
			status: 401,
			msg: 'UNAUTHORIZED'
		}
	}
}
