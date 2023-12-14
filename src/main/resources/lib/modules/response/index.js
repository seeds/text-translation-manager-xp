module.exports = {
    badRequest,
    unauthorized
}

function badRequest(message) {
    return {
        contentType: 'application/json',
        status: 400,
        body: {
            message: message
        }
    }
}

function unauthorized(message) {
    const defaultMessage = `You don't have permission`
    return {
        status: 401,
        contentType: 'application/json',
        body: {
            message: message || defaultMessage // TODO: Put in i18n
        }
    }
}