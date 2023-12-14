const Translate = require('/lib/modules/translate')

exports.put = function(req) {
    const siteId = req.params.site
    const language = req.params.language
    const key = req.params.key
    const status = req.params.status === 'true'

    const result = Translate.changeKeyStatus(siteId, language, key, status)

    if (!result) {
        return {
            contentType: 'application/json',
            status: 400,
            body: {
                message: 'Something went wrong' // TODO: Put in i18n
            }
        }
    }

    return {
        contentType: 'application/json',
        body: {
            message: 'The status was changed successfully' // TODO: Put in i18n
        }
    }
}
