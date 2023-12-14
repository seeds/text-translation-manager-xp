'use strict'

const Content = require('/lib/xp/content')
const Context = require('/lib/xp/context')
const Collections = require('/lib/util/collections')
const Objects = require('/lib/util/objects')
const Common = require('/lib/modules/common')

module.exports = {
	fromRepoBranch,
	getSite,
	getSiteConfig,
	publish,
	unpublish,
	hasView,
	query
}

function getSiteConfig (site) {
	if (typeof site === 'string' || !site || site.type !== 'portal:site') {
		site = getSite(site)
	}
	if (!site || !site.data || !site.data.siteConfig) return
	const installedAppsConfigs = Collections.forceArray(site.data.siteConfig)
	const matchedElements = installedAppsConfigs.filter((appConfig) => appConfig.applicationKey === app.name)
	return Objects.trySafe(() => matchedElements[0].config)
}

function getSite (siteRef) {
	if (siteRef) {
		let site
		if (typeof siteRef === 'string') {
			site = Content.getSite({ key: siteRef })
		} else if (typeof siteRef._path === 'string') {
			site = Content.getSite({ key: siteRef._path })
		} else if (typeof siteRef._id === 'string') {
			site = Content.getSite({ key: siteRef._id })
		}
		if (site) return site
	}
	// Get the oldest site from current repo
	const sites = Content.query({ start: 0, count: 1, contentTypes: ['portal:site'], query: '_path LIKE "/content/*"', sort: 'createdTime ASC' }).hits || []
	return sites[0]
}

function publish (id, includeChildren = true, includeDependencies = true) {
	return Content.publish({
		keys: Collections.forceArray(id),
		sourceBranch: 'draft',
		targetBranch: 'master',
		includeChildren,
		includeDependencies
	})
}

function unpublish (id) {
	return Content.unpublish({
		keys: Collections.forceArray(id)
	})
}

function hasView(content) {
	if (content) {
		const pageSections = Collections.forceArray(content.page).filter(page => !Objects.isEmpty(page))
		const templates = Content.query({
			count: 1,
			query: `data.supports='${content.type}'`,
			contentTypes: [
				'portal:page-template'
			]
		})
		return ((pageSections.length > 0) || (templates.total > 0))
	}
	return false
}

/**
 * @param {string} contextRepo null means to use the current, if any
 * @param {string} contextBranch null means to use the current, if any
 * @returns {CmsContent} CmsContent
 */
function fromRepoBranch (contextRepo, contextBranch) {
	return new CmsContent(contextRepo, contextBranch)
}

function query(params) {
	const result = Content.query(params) || {}

	if (result.hits) {
		result.hits.forEach(hit => {
			Common.setShortcutFields(hit)
		})
	}

	return result
}

/**
 * @param {string} repo
 * @param {string} branch
 * @param {function} callback
 */
function runInRepoBranch (repo, branch, callback) {
	if (typeof callback !== 'function') return

	if (!repo && !branch) {
		return callback()
	}
	const context = {}
	if (branch) {
		context.branch = branch
	}
	if (repo) {
		context.repository = repo
	}
	return Context.run(context, callback)
}

/**
 * @constructor
 * @param {string} repo
 * @param {string} branch
 * @returns {CmsContent}
 */
function CmsContent (repo, branch) {
	if (arguments.length === 0) { // Empty constructor
		return this
	}
	if (this) { // This one is the real constructor
		this.branch = branch
		this.repo = repo
		return this
	} else if (this === undefined) { // This one is used for casting
		return arguments[0]
	} else { // This might never happen
		this.branch = ''
		this.repo = ''
	}
}

/**
 * This function creates a content.
 * @param {object} params JSON with the parameters.
 * @param {string} [params.name] Name of content.
 * @param {string} params.parentPath Path to place content under.
 * @param {string} [params.displayName] Display name. Default is same as `name`.
 * @param {boolean} [params.requireValid=true] The content has to be valid, according to the content type, to be created. If requireValid=true and the content is not strictly valid, an error will be thrown.
 * @param {boolean} [params.refresh=true] If refresh is true, the created content will to be searchable through queries immediately, else within 1 second. Since there is a performance penalty doing this refresh, refresh should be set to false for bulk operations.
 * @param {string} params.contentType Content type to use.
 * @param {string} [params.language] The language tag representing the content’s locale.
 * @param {string} [params.childOrder] Default ordering of children when doing getChildren if no order is given in query
 * @param {object} params.data Actual content data.
 * @param {object} [params.x] eXtra data to use.
 * @param {object} [params.workflow] Workflow information to use. Default has state READY and empty check list.
 * @returns {object} Content created as JSON.
 */
CmsContent.prototype.create = function create (params) {
	if (!this.repo && !this.branch) return Content.create(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.create(params))
}

/**
 * Creates a media content.
 * @param {object} params JSON with the parameters.
 * @param {string} [params.name] Name of content.
 * @param {string} [params.parentPath=/] Path to place content under.
 * @param {string} [params.mimeType] Mime-type of the data.
 * @param {number} [params.focalX] Focal point for X axis (if it's an image).
 * @param {number} [params.focalY] Focal point for Y axis (if it's an image).
 * @param  params.data Data (as stream) to use.
 * @returns {object} Returns the created media content.
 */
CmsContent.prototype.createMedia = function createMedia (params) {
	if (!this.repo && !this.branch) return Content.createMedia(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.createMedia(params))
}

/**
 * This function deletes a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @returns {boolean} True if deleted, false otherwise.
 */
CmsContent.prototype.delete = function deleteContent (params) {
	if (!this.repo && !this.branch) return Content.delete(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.delete(params))
}

/**
 * Check if content exists.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @returns {boolean} True if exist, false otherwise.
 */
CmsContent.prototype.exists = function exists (params) {
	if (!this.repo && !this.branch) return Content.exists(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.exists(params))
}

/**
 * This function fetches a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @param {string} [params.versionId] Version Id of the content.
 * @returns {object} The content (as JSON) fetched from the repository.
 */
CmsContent.prototype.get = function get (params) {
	if (!this.repo && !this.branch) return Content.get(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.get(params))
}

/**
 * This function fetches children of a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the parent content.
 * @param {number} [params.start=0] Start index (used for paging).
 * @param {number} [params.count=10] Number of contents to fetch.
 * @param {string} [params.sort] Sorting expression.
 * @returns {Object} Result (of content) fetched from the repository.
 */
CmsContent.prototype.getChildren = function getChildren (params) {
	if (!this.repo && !this.branch) return Content.getChildren(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.getChildren(params))
}

/**
 * Returns outbound dependencies on a content.
 * @param {object} params JSON parameters.
 * @param {string} params.key Path or id of the content.
 * @returns {string[]} Content Ids.
 */
CmsContent.prototype.getOutboundDependencies = function getOutboundDependencies (params) {
	if (!this.repo && !this.branch) return Content.getOutboundDependencies(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.getOutboundDependencies(params))
}

/**
 * This function returns the parent site of a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @returns {object} The current site as JSON. Defaults to first site on repo if no parameter was informed
 */
CmsContent.prototype.getSite = function getSite (params) {
	if (!this.repo && !this.branch) return Content.getSite(params)
	return runInRepoBranch(this.repo, this.branch, () => {
		if (!params || typeof params === 'string' || params._id || params._path) {
			return module.exports.getSite(params)
		} else {
			return Content.getSite(params)
		}
	})
}

/**
 * This function returns the site configuration for this app in the parent site of a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @param {string} params.applicationKey Application key.
 * @returns {object} The site configuration for current application as JSON. Defaults to first site on repo if no parameter was informed
 */
CmsContent.prototype.getSiteConfig = function getSiteConfig (params) {
	if (!this.repo && !this.branch) return Content.getSiteConfig(params)
	return runInRepoBranch(this.repo, this.branch, () => {
		if (!params || typeof params === 'string' || params._id || params._path) {
			return module.exports.getSiteConfig(params)
		} else {
			return Content.getSiteConfig(params)
		}
	})
}

/**
 * This function modifies a content.
 * @param {object} params JSON with the parameters.
 * @param {string} params.key Path or id to the content.
 * @param {function} params.editor Editor callback function.
 * @param {boolean} [params.requireValid=true] The content has to be valid, according to the content type, to be updated. If requireValid=true and the content is not strictly valid, an error will be thrown.
 * @returns {object} Modified content as JSON.
 */
CmsContent.prototype.modify = function modify (params) {
	if (!this.repo && !this.branch) return Content.modify(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.modify(params))
}

/**
 * Rename a content or move it to a new path.
 * @param {object} params JSON with the parameters.
 * @param {string} params.source Path or id of the content to be moved or renamed.
 * @param {string} params.target New path or name for the content. If the target ends in slash '/', it specifies the parent path where to be moved. Otherwise it means the new desired path or name for the content.
 * @returns {object} The content that was moved or renamed.
 */
CmsContent.prototype.move = function move (params) {
	if (!this.repo && !this.branch) return Content.move(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.move(params))
}

/**
 * This command queries content.
 * @param {object} params JSON with the parameters.
 * @param {number} [params.start=0] Start index (used for paging).
 * @param {number} [params.count=10] Number of contents to fetch.
 * @param {string} params.query Query expression.
 * @param {object} [params.filters] Filters to apply to query result
 * @param {string} [params.sort] Sorting expression.
 * @param {string} [params.aggregations] Aggregations expression.
 * @param {string[]} [params.contentTypes] Content types to filter on.
 * @returns {Object} Result of query.
 */
CmsContent.prototype.query = function query (params) {
	if (!this.repo && !this.branch) return Content.query(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.query(params))
}

/**
 * Sets permissions on a content.
 * @param {object} params JSON parameters.
 * @param {string} params.key Path or id of the content.
 * @param {boolean} [params.inheritPermissions] Set to true if the content must inherit permissions. Default to false.
 * @param {boolean} [params.overwriteChildPermissions] Set to true to overwrite child permissions. Default to false.
 * @param {array} [params.permissions] Array of permissions.
 * @param {string} params.permissions.principal Principal key.
 * @param {array} params.permissions.allow Allowed permissions.
 * @param {array} params.permissions.deny Denied permissions.
 * @returns {boolean} True if successful, false otherwise.
 */
CmsContent.prototype.setPermissions = function setPermissions (params) {
	if (!this.repo && !this.branch) return Content.setPermissions(params)
	return runInRepoBranch(this.repo, this.branch, () => Content.setPermissions(params))
}
