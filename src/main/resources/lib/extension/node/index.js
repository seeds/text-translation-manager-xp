'use strict'

const Node = require('/lib/xp/node')
const Objects = require('/lib/util/objects')

const draftConfig = {
	branch: 'draft',
	principals: ['role:system.admin']
}
const masterConfig = {
	branch: 'master',
	principals: ['role:system.admin']
}

module.exports = {
	getCmsConnection,
	queryIds,
	getById,
	getActiveVersion,
	batchMove,
	modifyById,
	modifyMasterById,
	deleteById,
	publishById,
	unpublishById
}

/**
 * @param {string} repoKey
 */
function getCmsConnection (repoKey) {
	const master = Objects.assign({ repoId: repoKey }, masterConfig)
	const draft = Objects.assign({ repoId: repoKey }, draftConfig)
	return {
		master: Node.connect(master),
		draft: Node.connect(draft)
	}
}

function queryIds (cmsConn, branch, query) {
	return cmsConn[branch].query(query)
}

function getById (cmsConn, branch, idList) {
	return cmsConn[branch].get(idList)
}

function getActiveVersion (cmsConn, branch, id) {
	return cmsConn[branch].getActiveVersion({
		key: id
	})
}

function batchMove (cmsConn, moveMap, successFn, failureFn) {
	let success, afterMove, move, result
	const acc = []
	for (const i in moveMap) {
		move = moveMap[i]
		try {
			afterMove = cmsConn.draft.move({
				source: move.source,
				target: move.target
			})
			success = afterMove && afterMove._path
		} catch (e) {
			success = false
		}
		if (success) {
			if (typeof successFn === 'function') {
				result = successFn(afterMove, i, moveMap)
			}
		} else {
			if (typeof failureFn === 'function') {
				result = failureFn(i, moveMap)
			}
		}
		if (result !== null && result !== undefined) {
			acc.push(result)
		}
	}
	return acc
}

function modifyById (cmsConn, id, modifiedObject) {
	return cmsConn.draft.modify({
		key: id,
		editor: typeof modifiedObject === 'function' ? modifiedObject : function () {
			return modifiedObject
		}
	})
}

function modifyMasterById (cmsConn, id, modifiedObject) {
	return cmsConn.master.modify({
		key: id,
		editor: typeof modifiedObject === 'function' ? modifiedObject : function () {
			return modifiedObject
		}
	})
}

function publishById (cmsConn, idList, includeDependencies, includeChildren) {
	return cmsConn.draft.push({
		key: typeof idList === 'string' ? idList : null,
		keys: Array.isArray(idList) ? idList : null,
		target: 'master',
		resolve: !!includeDependencies,
		includeChildren: !!includeChildren
	})
}

function deleteById (cmsConn, idList) {
	return cmsConn.draft.delete(idList)
}

function unpublishById (cmsConn, idList) {
	return cmsConn.master.delete(idList)
}
