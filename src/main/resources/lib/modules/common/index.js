const Project = require('/lib/xp/project')
const Context = require('/lib/xp/context')
const Repo = require('/lib/xp/repo')
const Node = require('/lib/xp/node')
const Auth = require('/lib/xp/auth')
const Event = require('/lib/xp/event')

module.exports = {
    createRepo,
    getSites,
    getMultiRepo,
    sendUpdateEvent
}

function getMultiRepo() {
    const projects = Context.run({
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
    }, function() {
        return Project.list()
    })

    return Node.multiRepoConnect({
        sources: projects.map(project => {
            return {
                repoId: `com.enonic.cms.${project.id}`,
                branch: 'draft',
                principals: ["role:system.admin"]
            }
        })
    })
}

function createRepo(repoId) {
    try {
        let result = Repo.get(repoId)

        if (!result) {
            result = Repo.create({
                id: repoId
            })
            log.info(`Repository [${result.id}] created`)
        }
    } catch (err) {
        log.error(`Unexpected error: ${err.message}`)
    }
}

function getSites(user) {
    const sites = {
        allowed: [],
        forbidden: []
    }
    const multiRepo = getMultiRepo()

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
        const hasPermission = userHasPermission(user, site)
        if (hasPermission) {
            sites.allowed.push(site)
        } else {
            sites.forbidden.push(site)
        }
    })

    return sites
}

function userHasPermission(user, site) {
    return true
    // // TODO: Review the code to work with IdProvider users
    // const userRoles = Auth.getMemberships(user.key).filter(item => item.type === 'role').map(item => item.key)
    // log.info(`User Roles: ${JSON.stringify(userRoles)}`)
    // const siteWriteRoles = site._permissions
    //     .filter(permission => permission.allow.indexOf('MODIFY') !== -1)
    //     .map(permission => permission.principal)
    // log.info(`Site Write Roles: ${JSON.stringify(siteWriteRoles)}`)
    // return siteWriteRoles.some(role => userRoles.indexOf(role) !== -1)
}

function sendUpdateEvent() {
    Event.send({
        type: 'translationmanager-updated',
        distributed: true
    })
}
