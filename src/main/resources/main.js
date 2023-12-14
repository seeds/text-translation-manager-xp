const Context = require('/lib/xp/context')

const Common = require('/lib/modules/common')
const Translate = require('/lib/modules/translate')

Context.run({
    repository: 'com.enonic.cms.default',
    branch: 'draft',
    user: {
        login: 'su',
        idProvider: 'system'
    },
    principals: ['role:system.admin'],
    attributes: {
        ignorePublishTimes: true
    }
}, onStart)

function onStart() {
    try {
        Common.createRepo('text-translation-manager')
        Translate.initializeDatabase()
    } catch (err) {
        log.error(`Error on starting main controller. More details:  ${err}`)
    }
}
