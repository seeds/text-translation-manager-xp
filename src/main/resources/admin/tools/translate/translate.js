const Thymeleaf = require('/lib/thymeleaf')
const Portal = require('/lib/xp/portal')
const Auth = require('/lib/xp/auth')

const Common = require('/lib/modules/common')
const Translate = require('/lib/modules/translate')

exports.get = function () {
    const view = resolve('translate.html')

    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)
    const translateSites = Translate.getTranslateSites()

    const model = {
        sites: JSON.stringify(formatSites(sites, translateSites)),
        services: JSON.stringify({
            refreshDatabase: Portal.serviceUrl({
                service: 'refresh-database',
                type: 'absolute'
            }),
            manageLanguage: Portal.serviceUrl({
                service: 'manage-language',
                type: 'absolute'
            }),
            manageKey: Portal.serviceUrl({
                service: 'manage-key',
                type: 'absolute'
            }),
            publishKey: Portal.serviceUrl({
                service: 'publish-key',
                type: 'absolute'
            }),
        })
    }

    return {
        body: Thymeleaf.render(view, model)
    }
}

function formatSites(sites, translateSites) {
    const result = []
    sites.allowed.forEach(site => {
        if (site.language) {
            const siteExists = result.filter(r => r.id === site._id)[0]
            if (siteExists) {
                const languageExists = siteExists.languages.filter(l => l.id === site.language)[0]
                if (!languageExists) {
                    siteExists.languages.push({ id: site.language, title: site.language })
                }
            } else {
                if (site.displayName) {
                    result.push({
                        id: site._id,
                        title: `${site.displayName} (${site._path.replace('/content', '')})`,
                        languages: [{ id: site.language, title: site.language }]
                    })
                }
            }
        }
    })

    translateSites.forEach(site => {
        site.languages.forEach(language => {
            const isForbidden = sites.forbidden.filter(s => s._id === site.id && s.language === language).length > 0
            if (!isForbidden) {
                const siteExists = result.filter(r => r.id === site.id)[0]
                if (siteExists) {
                    const languageExists = siteExists.languages.filter(l => l.id === language)[0]
                    if (!languageExists) {
                        siteExists.languages.push({ id: language, title: language })
                    }
                }
            }
        })
    })

    result.forEach(r => {
        r.languages.sort(function (a, b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0) })
        r.languages.unshift({ id: '', title: 'Select language' })
    })

    result.unshift({ id: '', title: 'Select site' })

    return result
}
