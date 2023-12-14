const Portal = require('/lib/xp/portal')

const Translate = require('/lib/modules/translate')

const Collections = require('/lib/util/collections')

exports.responseProcessor = function (req, res) {
    const site = Portal.getSite() || {}
    const content = Portal.getContent() || {}

    const contentInherit = Collections.forceArray(content.inherit)
    const isLocalize = contentInherit.indexOf('CONTENT') === -1
    const language = isLocalize 
        ? (content.language || site.language) 
        : site.language

    const values = Translate.getKeys(site._id, language)

    const script = `
        <script id="text-translation-manager-values" type="application/json">${JSON.stringify(formatResponse(values))}</script>
        <script src="${Portal.assetUrl({path: 'js/translate.js'})}"></script>
    `

    var bodyEnd = res.pageContributions.bodyEnd
    if (!bodyEnd) {
        res.pageContributions.bodyEnd = []
    }

    res.pageContributions.bodyEnd.push(script)

    return res
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
