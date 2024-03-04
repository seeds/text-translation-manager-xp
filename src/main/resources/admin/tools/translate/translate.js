const Thymeleaf = require('/lib/thymeleaf')
const Portal = require('/lib/xp/portal')
const Auth = require('/lib/xp/auth')

const Common = require('/lib/modules/common')
const Translate = require('/lib/modules/translate')
const MyLicense = require('/lib/modules/license')

exports.get = function () {
    const view = resolve('translate.html')
    let model = {}

    // Validate the license
    if (!MyLicense.isCurrentLicenseValid()) {
        model = {
            noLicense: true,
            licenseServiceUrl: Portal.serviceUrl({ 
                service: 'license', 
                type: 'absolute' 
            }),
            translate: {
                textTranslationHeader: Common.localize('admin-tool.translate.view.text_translation_header'),
                licenseHeader: Common.localize('admin-tool.translate.view.license_header'),
                noLicense: Common.localize('admin-tool.translate.view.no_license'),
                uploadLicense: Common.localize('admin-tool.translate.view.upload_license'),
                invalidLicense: Common.localize('admin-tool.translate.view.invalid_license')
            }
        }

        return {
            contentType: 'text/html',
            body: Thymeleaf.render(view, model)
        }
    }

    const user = Auth.getUser() || {}
    const sites = Common.getSites(user)
    const translateSites = Translate.getTranslateSites()

    model = {
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
        }),
        translate: {
            textTranslationHeader: Common.localize('admin-tool.translate.view.text_translation_header'),
            siteSelectorLabel: Common.localize('admin-tool.translate.view.site_selector_label'),
            languageSelectorLabel: Common.localize('admin-tool.translate.view.language_selector_label'),
            languageSelectorTooltip: Common.localize('admin-tool.translate.view.language_selector_tooltip'),
            searchLabel: Common.localize('admin-tool.translate.view.search_label'),
            searchPlaceholder: Common.localize('admin-tool.translate.view.search_placeholder'),
            addLanguageModalHeader: Common.localize('admin-tool.translate.view.add_language_modal_header'),
            addLanguageModalAddBtn: Common.localize('admin-tool.translate.view.add_language_modal_add_btn'),
            addLanguageModalCancelBtn: Common.localize('admin-tool.translate.view.add_language_modal_cancel_btn'),
            deleteKeyModalHeader: Common.localize('admin-tool.translate.view.delete_key_modal_header'),
            deleteKeyModalContent: Common.localize('admin-tool.translate.view.delete_key_modal_content'),
            deleteKeyModalConfirmBtn: Common.localize('admin-tool.translate.view.delete_key_modal_confirm_btn'),
            deleteKeyModalCancelBtn: Common.localize('admin-tool.translate.view.delete_key_modal_cancel_btn'),
            publishKeyModalCancelBtn: Common.localize('admin-tool.translate.view.publish_key_modal_cancel_btn'),
            addKeyModalHeader: Common.localize('admin-tool.translate.view.add_key_modal_header'),
            addKeyModalKeyLabel: Common.localize('admin-tool.translate.view.add_key_modal_key_label'),
            addKeyModalKeyPlaceholder: Common.localize('admin-tool.translate.view.add_key_modal_key_placeholder'),
            addKeyModalDraftLabel: Common.localize('admin-tool.translate.view.add_key_modal_draft_label'),
            addKeyModalTranslationsHeader: Common.localize('admin-tool.translate.view.add_key_modal_translations_header'),
            addKeyModalSaveBtn: Common.localize('admin-tool.translate.view.add_key_modal_save_btn'),
            addKeyModalCancelBtn: Common.localize('admin-tool.translate.view.add_key_modal_cancel_btn'),
            editKeyModalHeader: Common.localize('admin-tool.translate.view.edit_key_modal_header'),
            editKeyModalKeyLabel: Common.localize('admin-tool.translate.view.edit_key_modal_key_label'),
            editKeyModalKeyPlaceholder: Common.localize('admin-tool.translate.view.edit_key_modal_key_placeholder'),
            editKeyModalTranslationsHeader: Common.localize('admin-tool.translate.view.edit_key_modal_translations_header'),
            editKeyModalSaveBtn: Common.localize('admin-tool.translate.view.edit_key_modal_save_btn'),
            editKeyModalResetBtn: Common.localize('admin-tool.translate.view.edit_key_modal_reset_btn'),
            editKeyModalCancelBtn: Common.localize('admin-tool.translate.view.edit_key_modal_cancel_btn'),
            syncTooltip: Common.localize('admin-tool.translate.view.sync_tooltip'),
            addKeyTooltip: Common.localize('admin-tool.translate.view.add_key_tooltip'),
        },
        customJSTranslate: JSON.stringify({
            publishedLabel: Common.localize('admin-tool.translate.view.custom_js_published_label'),
            draftLabel: Common.localize('admin-tool.translate.view.custom_js_draft_label'),
            tableKeyHeader: Common.localize('admin-tool.translate.view.custom_js_table_key_header'),
            tableCreatedHeader: Common.localize('admin-tool.translate.view.custom_js_table_created_header'),
            tableLastUpdatedHeader: Common.localize('admin-tool.translate.view.custom_js_table_last_updated_header'),
            tableValueHeader: Common.localize('admin-tool.translate.view.custom_js_table_value_header'),
            tableActionsHeader: Common.localize('admin-tool.translate.view.custom_js_table_actions_header'),
            tableEditKeyLabel: Common.localize('admin-tool.translate.view.custom_js_table_edit_key_label'),
            tablePublishLabel: Common.localize('admin-tool.translate.view.custom_js_table_publish_label'),
            tableUnpublishLabel: Common.localize('admin-tool.translate.view.custom_js_table_unpublish_label'),
            tableDeleteKeyLabel: Common.localize('admin-tool.translate.view.custom_js_table_delete_key_label'),
            notifySuccess: Common.localize('admin-tool.translate.view.custom_js_notify_success'),
            notifyError: Common.localize('admin-tool.translate.view.custom_js_notify_error'),
            publishModalPublishLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_publish_label'),
            publishModalUnpublishLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_unpublish_label'),
            publishModalPublishKeyLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_publish_key_label'),
            publishModalUnpublishKeyLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_unpublish_key_label'),
            publishModalPublishAllLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_publish_all_label'),
            publishModalUnpublishAllLabel: Common.localize('admin-tool.translate.view.custom_js_publish_modal_unpublish_all_label'),
            editFieldModalHeader: Common.localize('admin-tool.translate.view.custom_js_edit_field_modal_header'),
        })
    }

    return {
        contentType: 'text/html',
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
