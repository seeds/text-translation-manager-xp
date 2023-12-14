const Portal = require('/lib/xp/portal')

const Translate = require('/lib/modules/translate')

exports.get = function (req) {
    const site = Portal.getSite() || {}
    const language = req.params.language || site.language

    const values = Translate.getKeys(site._id, language)

    return {
        contentType: 'application/json',
        body: formatResponse(values)
    }
}

function formatResponse(items) {
    return (items || [])
        .filter(item => item.status)
        .map(item => {
            return {
                key: item.key,
                value: item.value
            }
        })
}
