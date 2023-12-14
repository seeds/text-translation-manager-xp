'use strict'

const Portal = require('/lib/xp/portal')
const Content = require('/lib/xp/content')
const Objects = require('/lib/util/objects')
const Strings = require('/lib/util/strings')

module.exports = {
	pageUrl,
	getAssetURL,
	processHTMLField,
	imageUrl,
	processTextArea,
	getLink,
	getSite,
	getSiteLanguage
}

/* Function to choose the correct link based on internal and external link fields.
/  The external link has priority.
/  internal: _id
/  external: string
*/
function getLink(internal, external) {
	if (internal) {
		return {
			href: pageUrl(internal),
			target: '_self'
		}
	} else if (external) {
		return {
			href: external,
			target: '_blank',
			rel: 'noopener'
		}
	} else {
		return {
			href: 'javascript:void(0)',
			target: '',
			noLink: true
		}
	}
}

function pageUrl(nodeID, params) {
	return nodeID && Portal.pageUrl({
		id: nodeID,
		params: params,
		type: 'absolute'
	})
}

function getAssetURL(assetPath) {
	return Portal.assetUrl({
		path: assetPath,
		type: 'absolute'
	})
}

function trimHTMLString(htmlString) {
	if (htmlString && (typeof htmlString === 'string')) {
		htmlString = htmlString.replace(/^ *<p>(&nbsp;| )+/g, '<p>').replace(/(&nbsp;| )*<\/p>/g, '</p>')
		const htmlWithoutEmptyParagraphs = htmlString.replace(/<p><\/p>(\n)*/g, '')
		htmlString = htmlWithoutEmptyParagraphs === '' ? htmlWithoutEmptyParagraphs : htmlString.replace(/<p><\/p>(\n)*/g, '<br>')
	}
	return Strings.toStringOrDefault(htmlString)
}

function protectEmailsInHtmlArea(html) {
	if (html) {
		return html.replace(/<a +href="mailto: *[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)* *".*<\/a>/g, (link) => {
			const text = link.replace(/<a.*?>/g, '').replace(/<\/a>/g, '')
			const email = link.match(/"mailto: *[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)* *"/g)
			const address = email && email[0].replace(/"mailto: */g, '').replace(/@.*"/g, '')
			const domain = email && email[0].replace(/.*@/g, '').replace(/[ "]*$/g, '')

			if (text && address && domain) {
				return `
					<script>
						emailLinkObfuscated('${address}', '${domain}', '${text}')
					</script>
				`
			} else {
				return link
			}
		})
	} else {
		return html
	}
}

function removeWrappingCodeMacroParagraphs(htmlString = '') {
	return htmlString.replace(/\u00a0|\n/gm, '').replace(/<p>\[kode.*?\]<\/p>/gm, (macro) => {
		return macro.replace(/^<p>/, '').replace(/<\/p>$/, '')
	})
}

function processHTMLField(HTMLAreaField) {
	if (HTMLAreaField) {
		HTMLAreaField = trimHTMLString(HTMLAreaField)
		HTMLAreaField = protectEmailsInHtmlArea(HTMLAreaField)
		HTMLAreaField = removeWrappingCodeMacroParagraphs(HTMLAreaField)
	}

	const processedText = HTMLAreaField && Portal.processHtml({
		value: HTMLAreaField
	})
	return Strings.toStringOrDefault(processedText, null) || ''
}

function processTextArea(textArea = '') {
	return textArea.replace(/\n/g, '<br>')
}

function imageUrl(imageId, scale, format, quality) {
	if (imageId) {
		const imgObj = Content.get({ key: imageId })
		if (!imgObj) {
			return false
		}
		const imgOpts = {
			id: imageId,
			scale: scale || 'width(720)',
			type: 'absolute'
		}

		if (format || quality) {
			if (imgObj.type !== 'media:vector' && format) {
				imgOpts.format = format
			}
			if (imgObj.type !== 'media:vector' && quality) {
				imgOpts.quality = quality
			}
		}

		let link = Portal.imageUrl(imgOpts)

		if (typeof link === 'string' && link.indexOf('error/404') === -1 && link.indexOf('error/500') === -1) {
			return {
				link,
				alt: (imgObj.data && imgObj.data.altText) || imgObj.displayName || '',
				title: imgObj.displayName || '',
				caption: (imgObj.data && imgObj.data.caption) || ''
			}
		} else {
			return false
		}
	} else {
		return false
	}
}

/**
 * @param {object} [refContent] Optional
 */
function getSite(refContent) {
	let site
	if (refContent && (refContent._id || refContent._path)) {
		site = Content.getSite({ key: (refContent._id || refContent._path) })
	} else {
		site = Portal.getSite()
	}
	return site
}

/**
 * @param {object} [refContent] Optional
 */
function getSiteLanguage(refContent) {
	const site = getSite(refContent) || {}
	const lang = (site.language || 'no').split(/-_/g)[0]
	return lang
}
