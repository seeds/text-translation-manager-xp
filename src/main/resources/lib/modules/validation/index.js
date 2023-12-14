const Node = require('/lib/xp/node')

module.exports = {
    isKeyDuplicated,
    languageExists
}

const repo = Node.connect({
    repoId: 'text-translation-manager',
    branch: 'master',
    principals: ['role:system.admin']
})

function isKeyDuplicated(siteId, key) {
    const query = repo.query({
        count: 1,
        query: `_parentPath='/${siteId}' AND data.key='${key}'`
    })
    return query.total > 0
}

function languageExists(siteId, language) {
    const query = repo.query({
        count: 1,
        query: `_path='/${siteId}/${language}'`
    })
    return query.total > 0
}