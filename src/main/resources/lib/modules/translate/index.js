const Node = require('/lib/xp/node')

const Collections = require('/lib/util/collections')

const Common = require('/lib/modules/common')

const DateFns = require('/lib/external/date-fns')

module.exports = {
    getTranslateSites,
    initializeDatabase,
    createSiteDatabase,
    createLanguageDatabase,
    createTranslateKey,
    setTranslate,
    deleteKey,
    getKeys,
    getKeyValue,
    addKey,
    getKeyValues,
    editKey,
    changeKeyStatus
}

const repo = Node.connect({
    repoId: 'text-translation-manager',
    branch: 'master',
    principals: ['role:system.admin']
})

function getTranslateSites() {
    const sites = []
    const sitesQuery = repo.query({
        count: -1,
        query: `_parentPath='/'`
    })
    sitesQuery.hits.forEach(siteQuery => {
        const site = repo.get({ key: siteQuery.id })
        sites.push({ id: site._name, languages: [] })

        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${site._name}'`
        })
        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            sites[sites.length - 1].languages.push(language._name)
        })
    })
    return sites
}

function initializeDatabase() {
    const sites = []
    const multiRepo = Common.getMultiRepo()

    const sitesQuery = multiRepo.query({
        query: `type='portal:site'`,
        count: -1
    })

    sitesQuery.hits.forEach(siteQuery => {
        const repoConnection = Node.connect({
            repoId: siteQuery.repoId,
            branch: 'draft',
            principals: ['role:system.admin']
        })

        const site = repoConnection.get({ key: siteQuery.id })
        const siteExists = sites.filter(s => s._id === site._id)
        if ((siteExists.length > 0) && site.language) {
            const languages = siteExists[0].language.concat([site.language])
            siteExists[0].language = languages.filter(function (item, pos) {
                return languages.indexOf(item) == pos
            })
        } else {
            site.language = Collections.forceArray(site.language)
            sites.push(site)
        }
    })

    const sitesCreated = []
    for (let i = 0; i < sites.length; i++) {
        const site = sites[i]
        if (sitesCreated.indexOf(site._id) === -1) {
            createSiteDatabase(site)
            sitesCreated.push(site._id)
        }
        if (site.language) {
            Collections.forceArray(site.language).forEach(language => {
                createLanguageDatabase(site._id, language)
            })
        }
    }

    removeSitesNoLongerExists()
}

function removeSitesNoLongerExists() {
    const sitesQuery = repo.query({
        count: -1,
        query: `_parentPath='/'`
    })
    const multiRepo = Common.getMultiRepo()
    const sitesToDelete = []
    sitesQuery.hits.forEach(siteQuery => {
        const site = repo.get({ key: siteQuery.id })
        const originalSite = multiRepo.query({
            count: 1,
            query: `_id='${site._name}'`
        })
        if (originalSite.total === 0) {
            sitesToDelete.push(site._id)
        }
    })
    if (sitesToDelete.length > 0) {
        repo.delete(sitesToDelete)
    }
}

function createSiteDatabase(site) {
    try {
        const result = repo.get({ key: `/${site._id}` })

        if (!result) {
            const response = repo.create({
                _parentPath: '/',
                _name: site._id,
                data: {
                    name: site._name
                }
            })

            log.info(`Site [${site._name}] [${response._id}] created`)
        } else {
            repo.modify({
                key: result._id,
                editor: (node) => {
                    node.data.name = site._name
                    return node
                }
            })
            log.info(`Site [${site._name}] updated`)
        }
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function createLanguageDatabase(siteId, languageName) {
    try {
        let result = repo.get({ key: `/${siteId}/${languageName}` })

        if (!result) {
            let data = []
            const languagesQuery = repo.query({
                count: 1,
                query: `_parentPath='/${siteId}'`
            })

            if (languagesQuery.total > 0) {
                const languageExists = repo.get({ key: languagesQuery.hits[0].id })
                data = Collections.forceArray(languageExists.data)
                    .map(d => {
                        return {
                            key: d.key, 
                            value: '', 
                            status: d.status,
                            createdTime: new Date(),
                            modifiedTime: new Date()
                        }
                    })
            }

            result = repo.create({
                _parentPath: `/${siteId}`,
                _name: languageName,
                data: data
            })

            log.info(`Language [${languageName}] in [${siteId}] created`)
        }

        return result
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function addKey(siteId, key, status, values, forbiddenSites) {
    try {
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteId}'`
        })

        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const keys = Collections.forceArray(language.data).map(data => data.key)
            if (keys.indexOf(key) === -1) {
                const isForbidden = forbiddenSites.filter(f => (f._id === siteId) && (f.language === language._name)).length > 0
                log.info(`ISFORBIDDEN: ${siteId} - ${language._name} - ${isForbidden}`)
                const value = (values.filter(v => v.id === language._name)[0] || {}).value || ''
                const data = {
                    key: key,
                    value: !isForbidden ? value : '',
                    status: !isForbidden ? status : false,
                    createdTime: new Date(),
                    modifiedTime: new Date()
                }
                repo.modify({
                    key: languageQuery.id,
                    editor: (node) => {
                        if (!Array.isArray(node.data)) {
                            node.data = Collections.forceArray(node.data).concat([data])
                        } else {
                            node.data.push(data)
                        }
                        return node
                    }
                })
                log.info(`Key [${key}] added to language [${language._name}] in [${siteId}]`)
            }
        })

        return true
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function editKey(siteId, key, originalKey, values, forbiddenSites) {
    try {
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteId}'`
        })

        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const keys = Collections.forceArray(language.data).map(data => data.key)
            const index = keys.indexOf(originalKey)
            if (index !== -1) {
                const value = (values.filter(v => v.id === language._name)[0] || {}).value || ''
                const isForbidden = forbiddenSites.filter(f => (f._id === siteId) && (f.language === language._name)).length > 0
                if (!isForbidden) {
                    repo.modify({
                        key: languageQuery.id,
                        editor: (node) => {
                            if (!Array.isArray(node.data)) {
                                node.data.key = key
                                node.data.value = value
                                node.data.modifiedTime = new Date()
                            } else {
                                node.data[index].key = key
                                node.data[index].value = value
                                node.data[index].modifiedTime = new Date()
                            }
                            return node
                        }
                    })
                    log.info(`Key [${key}] modified to language [${language._name}] in [${siteId}]`)
                }
            }
        })

        return true
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function createTranslateKey(siteName, key) {
    try {
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteName}'`
        })

        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const keys = Collections.forceArray(language.data).map(data => data.key)
            if (keys.indexOf(key) === -1) {
                repo.modify({
                    key: languageQuery.id,
                    editor: (node) => {
                        if (!Array.isArray(node.data)) {
                            node.data = Collections.forceArray(node.data).concat([{
                                key: key,
                                value: ''
                            }])
                        } else {
                            node.data.push({
                                key: key,
                                value: ''
                            })
                        }
                        return node
                    }
                })
                log.info(`Key [${key}] added to language [${language._name}] in [${siteName}]`)
            }
        })
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function setTranslate(siteName, languageName, key, value) {
    try {
        const result = repo.get({ key: `/${siteName}/${languageName}` })
        if (result) {
            const keys = Collections.forceArray(result.data).map(data => data.key)
            const index = keys.indexOf(key)
            if (index !== -1) {
                repo.modify({
                    key: result._id,
                    editor: (node) => {
                        if (!Array.isArray(node.data)) {
                            node.data.value = value
                        } else {
                            node.data[index].value = value
                        }
                        return node
                    }
                })
                log.info(`Key [${key}] update to language [${languageName}] in [${siteName}]`)
            }
        }
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function deleteKey(siteName, key) {
    try {
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteName}'`
        })
        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const keys = Collections.forceArray(language.data).map(data => data.key)
            const index = keys.indexOf(key)
            if (index !== -1) {
                repo.modify({
                    key: language._id,
                    editor: (node) => {
                        if (!Array.isArray(node.data)) {
                            node.data = []
                        } else {
                            node.data.splice(index, 1)
                        }
                        return node
                    }
                })
            }
        })
        log.info(`Key [${key}] removed from site [${siteName}]`)

        return true
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function getKeys(siteId, languageName) {
    try {
        const result = repo.get({ key: `/${siteId}/${languageName}` }) || {}
        return Collections.forceArray(result.data).map(data => {
            return {
                key: data.key,
                createdTime: DateFns.format(data.createdTime, 'DD/MM/YYYY'),
                modifiedTime: DateFns.format(data.modifiedTime, 'DD/MM/YYYY'),
                value: data.value,
                status: data.status
            }
        })
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function getKeyValues(siteId, key, forbiddenSites) {
    try {
        const result = {
            key: key,
            values: [],
            forbidden: []
        }
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteId}'`
        })

        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const item = Collections.forceArray(language.data).filter(data => data.key === key)[0]
            const isForbidden = forbiddenSites.filter(f => (f._id === siteId) && (f.language === language._name)).length > 0
            if (item) {
                if (!isForbidden) {
                    result.values.push({
                        language: language._name,
                        value: item.value
                    })
                } else {
                    result.forbidden.push({
                        language: language._name,
                        value: item.value
                    })
                }
            }
        })

        return result
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function getKeyValue(siteName, languageName, key) {
    try {
        const result = repo.get({ key: `/${siteName}/${languageName}` }) || {}
        const item = Collections.forceArray(result.data).filter(data => data.key === key)[0] || {}
        return item.value || null
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function changeKeyStatus(siteId, languageName, key, status) {
    try {
        const languagesQuery = repo.query({
            count: -1,
            query: `_parentPath='/${siteId}' ${languageName ? `AND _name='${languageName}'` : ''}`
        })
        languagesQuery.hits.forEach(languageQuery => {
            const language = repo.get({ key: languageQuery.id })
            const keys = Collections.forceArray(language.data).map(data => data.key)
            const index = keys.indexOf(key)
            if (index !== -1) {
                repo.modify({
                    key: language._id,
                    editor: (node) => {
                        if (!Array.isArray(node.data)) {
                            node.data.status = status
                        } else {
                            node.data[index].status = status
                        }
                        return node
                    }
                })
            }
        })

        return true
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}
