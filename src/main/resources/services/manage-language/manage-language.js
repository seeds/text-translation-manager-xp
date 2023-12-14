const Translate = require('/lib/modules/translate')
const Validation = require('/lib/modules/validation')
const Response = require('/lib/modules/response')

exports.post = function(req) {
    const siteId = req.params.site
    const language = req.params.language
    const result = Translate.createLanguageDatabase(siteId, language)

    if (Validation.languageExists(siteId, language)) {
        return Response.badRequest(`The language already exists for this site`)
    }

    return {
        contentType: 'application/json',
        body: {
            data: result,
            message: 'The language was added successfully' // TODO: Put in i18n
        }
    }
}
