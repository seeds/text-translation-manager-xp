const Auth = require('/lib/xp/auth')

const Common = require('/lib/modules/common')
const Translate = require('/lib/modules/translate')
const Validation = require('/lib/modules/validation')
const Response = require('/lib/modules/response')

exports.get = function (req) {
    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)

    const siteId = req.params.site
    const language = req.params.language
    const key = req.params.key

    if (language) {
        const isForbidden = sites.forbidden.filter(s => (s._id === siteId) && (s.language === language)).length > 0
        if (isForbidden) {
            return Response.unauthorized()
        }
    }

    let result
    if (key) {
        result = Translate.getKeyValues(siteId, key, sites.forbidden) || {}
    } else {
        result = Translate.getKeys(siteId, language) || []
    }

    return {
        contentType: 'application/json',
        body: {
            result: result
        }
    }
}

exports.put = function (req) {
    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)

    const siteId = req.params.site
    const key = req.params.key
    const originalKey = req.params.originalKey
    const values = JSON.parse(req.params.values)

    if ((originalKey !== key) && Validation.isKeyDuplicated(siteId, key)) {
        return Response.badRequest(`The key can not be renamed to "${key}" as this key already exists for this site.`)
    }

    const result = Translate.editKey(siteId, key, originalKey, values, sites.forbidden)

    if (!result) {
        return Response.badRequest('Something went wrong')
    }

    Common.sendUpdateEvent()

    return {
        contentType: 'application/json',
        body: {
            message: 'The key was added successfully' // TODO: Put in i18n
        }
    }
}

exports.post = function (req) {
    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)

    const siteId = req.params.site
    const key = req.params.key
    const status = req.params.status === 'true'
    const values = JSON.parse(req.params.values)

    if (Validation.isKeyDuplicated(siteId, key)) {
        return Response.badRequest(`The key could not be created as it already exists in the system.`)
    }

    const result = Translate.addKey(siteId, key, status, values, sites.forbidden)

    if (!result) {
        return Response.badRequest('Something went wrong')
    }

    Common.sendUpdateEvent()

    return {
        contentType: 'application/json',
        body: {
            message: 'The key was added successfully' // TODO: Put in i18n
        }
    }
}

exports.delete = function (req) {
    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)

    const key = req.params.key
    const site = req.params.site

    const hasPermission = sites.allowed.filter(s => s._id === site).length > 0

    if (!hasPermission) {
        return Response.unauthorized()
    }

    const result = Translate.deleteKey(site, key)

    if (!result) {
        return Response.badRequest('Something went wrong')
    }

    Common.sendUpdateEvent()

    return {
        contentType: 'application/json',
        body: {
            message: 'The key was removed successfully' // TODO: Put in i18n
        }
    }
}
