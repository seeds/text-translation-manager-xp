var services = {}
var sites = []
var datatable = null
var editKeyModalValues = {}

$(document).ready(function () {
    initializeSelectors()
    initializeServices()
    initializeDatatable()
    initializeModal()
    initializeAddLanguageSelector()

    listeners()

    // TEst: checked
    // .is(':checked')
})

function listeners() {
    // Refresh database
    $('#refresh-button').on('click', function () {
        refreshDatabase($(this))
    })

    // Modal open
    $('#language-selector button').on('click', function () {
        $('.ui.add-language.modal').modal('show')
    })
    $('#add-key-button').on('click', function () {
        openAddKeyModal()
    })

    // Actions
    $('.ui.add-language.modal .actions .add').on('click', function () {
        addLanguage($(this))
    })
    $('.ui.add-key.modal .actions .add').on('click', function () {
        addKey($(this))
    })
    $('.ui.edit-key.modal .actions .reset').on('click', function () {
        $('.ui.edit-key.modal form').trigger('reset')
        $('.ui.edit-key.modal input[name="key"]').val(editKeyModalValues.key)
        $('.ui.edit-key.modal .field.translate').remove()
        $('.ui.edit-key.modal .form').append(editKeyModalValues.values.map(function (item) {
            var languageObj = languageList.find(function (l) { return l.id === item.language })
            return "<div class='field translate'><label>" + (languageObj ? languageObj.title : item.language) + "</label><textarea name='" + item.language + "' rows='3'>" + item.value + "</textarea></div>"
        }))
    })
    $('.ui.edit-key.modal .actions .save').on('click', function () {
        editKey($(this))
    })
    $('.ui.publish-key.modal .actions .publish').on('click', function () {
        publishKey($(this))
    })
    $('.ui.publish-key.modal .actions .publish-all').on('click', function () {
        publishKey($(this))
    })

    // Switch status
    $('.ui.add-key.modal .publish input').on('change', function () {
        if ($(this).is(':checked')) {
            $('.ui.add-key.modal .publish label').text('Published')
        } else {
            $('.ui.add-key.modal .publish label').text('Draft')
        }
    })

    // Datatable search
    $('#custom-table-search input').on('keyup', function () {
        if (datatable) {
            datatable.search($(this).val()).draw()
        }
    })
}

function initializeServices() {
    services = JSON.parse($('#services').val())
}

function initializeAddLanguageSelector() {
    $('.ui.add-language.modal select').empty()
    for (var i = 0; i < languageList.length; i++) {
        $('.ui.add-language.modal select').append($('<option>').val(languageList[i].id).text(languageList[i].title))
    }
    $('.ui.add-language.modal .ui.dropdown').dropdown()
}

function initializeSelectors() {
    sites = JSON.parse($('#sites').val())

    $('#site-selector select').empty()
    for (var i = 0; i < sites.length; i++) {
        $('#site-selector select').append($('<option>').val(sites[i].id).text(sites[i].title))
    }
    $('#site-selector').show()

    $('#site-selector select').on('change', function () {
        var value = $(this).val()
        if (value) {
            var siteSelected = sites.filter(function (site) { return site.id === value })[0]
            var languages = siteSelected.languages
            if (languages && languages.length > 0) {
                drawLanguageSelector(languages)
            }
            $('#add-key-button').show()
        } else {
            $('#language-selector').hide()
            $('#add-key-button').hide()
            $('#datatable-translate').hide()
            $('#custom-table-search').hide()
        }
    })

    $('#language-selector select').on('change', function () {
        var site = $('#site-selector select').val()
        var value = $(this).val()
        if (value) {
            getTranslates(site, value)
        } else {
            $('#datatable-translate').hide()
            $('#custom-table-search').hide()
        }
    })
}

function initializeDatatable() {
    $.fn.dataTable.moment('DD/MM/YYYY')
    datatable = $('#datatable-translate').DataTable({
        paging: false,
        info: false,
        dom: '<"top"i>rt<"bottom"><"clear">', // TODO: Comment if use pagination
        columns: [
            { data: 'key', title: 'Key', width: '250px' },
            { data: 'createdTime', title: 'Created', width: '100px' },
            { data: 'modifiedTime', title: 'Last updated', width: '100px' },
            {
                data: 'value', title: 'Value',
                render: function (data) {
                    return data.replace(/\n/g, '<br>')
                }
            },
            {
                data: 'actions', orderable: false, title: 'Actions', width: '65px',
                render: function (data, type, row, meta) {
                    return '<div class="ui icon buttons">'
                        + '<button class="ui button icon edit-key-button" data-key-id="' + data.keyId + '" data-tooltip="Edit key ' + data.keyId + '" data-inverted="" data-position="left center"><i class="edit blue icon"></i></button>'
                        + '<button class="ui button icon publish-key-button" data-key-id="' + data.keyId + '" data-key-status="' + data.status + '" data-tooltip="' + (data.status ? 'Unpublish' : 'Publish') + ' key ' + data.keyId + '" data-inverted="" data-position="left center"><i class="' + (data.status ? 'toggle on' : 'toggle off') + ' icon"></i></button>'
                        + '<button class="ui button icon delete-key-button" data-key-id="' + data.keyId + '" data-tooltip="Delete key ' + data.keyId + '" data-inverted="" data-position="left center"><i class="trash red icon"></i></button>'
                        + '</div>'
                }
            },
        ]
    })
}

function initializeModal() {
    $('.ui.delete-key.modal').modal({
        blurring: true,
        onApprove: function () {
            var key = $('.ui.delete-key.modal .key').text()
            deleteKey(key)
        }
    })
    $('.ui.add-language.modal').modal()
    $('.ui.add-key.modal').modal()
    $('.ui.edit-key.modal').modal({
        observeChanges: true
    })
    $('.ui.publish-key.modal').modal()
}

function refreshDatabase(button) {
    button.prop('disabled', true)
    $.ajax({
        type: 'PUT',
        url: services.refreshDatabase,
        success: function (data) {
            notify(data.message, 'success')
            location.reload()
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    }).always(function () {
        button.prop('disabled', false)
    })
}

function addLanguage(button) {
    button.prop('disabled', true)
    var site = $('#site-selector select').val()
    var language = $('.ui.add-language.modal select').val()
    $.ajax({
        type: 'POST',
        url: services.manageLanguage,
        data: {
            site: site,
            language: language
        },
        success: function (data) {
            var siteSelected = sites.find(function (s) { return s.id === site })
            var languageSelected = $('#language-selector select').val()

            if (siteSelected) {
                var languageExists = siteSelected.languages.find(function (l) { return l.id === language })

                if (!languageExists) {
                    var firstElement = siteSelected.languages.shift()
                    siteSelected.languages.push({ id: language, title: language })
                    siteSelected.languages.sort(function (a, b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0) })
                    siteSelected.languages.unshift(firstElement)

                    drawLanguageSelector(siteSelected.languages)

                    $('#language-selector select').val(languageSelected)
                }
            }
            $('.ui.add-language.modal').modal('hide')
            notify(data.message, 'success')
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    }).always(function () {
        button.prop('disabled', false)
    })
}

function drawLanguageSelector(languages) {
    $('#language-selector select').empty()

    for (var i = 0; i < languages.length; i++) {
        var language = languages[i]
        var languageSelected = languageList.find(function (l) { return l.id === language.id })
        $('#language-selector select').append($('<option>').val(language.id).text(languageSelected ? languageSelected.title : language.title))
    }

    $('#language-selector').show()
}

function notify(message, type) {
    $.uiAlert({
        textHead: type === 'success' ? 'Success' : 'Error',
        text: message || '',
        bgcolor: type === 'success' ? '#19c3aa' : '#db2828',
        textcolor: '#fff',
        position: 'bottom-left', // top And bottom ||  left / center / right
        icon: 'checkmark box',
        time: 3
    });
}

function openAddKeyModal() {
    $('.ui.add-key.modal .form').each(function () {
        this.reset()
    })
    var languages = $('#language-selector option')
        .toArray()
        .filter(function (l) { return l.value })
        .map(function (l) {
            return {
                id: l.value,
                title: l.text
            }
        })

    $('.ui.add-key.modal .field.translate').remove()

    $('.ui.add-key.modal .form').append(languages.map(function (language) {
        return "<div class='field translate'><label>" + language.title + "</label><textarea name='" + language.id + "' rows='3'></textarea></div>"
    }))

    $('.ui.add-key.modal').modal('show')

    setTimeout(function () { // TODO: Need to solve the modal position issue
        $('.ui.add-key.modal').modal('refresh')
    }, 1000)
}

function openPublishModal(button) {
    var keyId = button.attr('data-key-id')
    var status = button.attr('data-key-status') === 'true'
    var languageSelected = $('#language-selector select').val()
    var language = (languageList.find(function (l) { return l.id === languageSelected }) || {}).title

    $('.ui.publish-key.modal .header').text((status ? 'Unpublish' : 'Publish') + ' key ' + keyId)

    $('.ui.publish-key.modal .actions .publish-all').text((status ? 'Unpublish' : 'Publish') + ' in all languages')
    $('.ui.publish-key.modal .actions .publish-all').attr('data-key-id', keyId)
    $('.ui.publish-key.modal .actions .publish-all').attr('data-key-status', !status)

    $('.ui.publish-key.modal .actions .publish').text((status ? 'Unpublish' : 'Publish') + ' only in ' + language)
    $('.ui.publish-key.modal .actions .publish').attr('data-key-id', keyId)
    $('.ui.publish-key.modal .actions .publish').attr('data-key-status', !status)
    $('.ui.publish-key.modal .actions .publish').attr('data-key-language', languageSelected)

    $('.ui.publish-key.modal').modal('show')
}

function openEditKeyModal(button) {
    var site = $('#site-selector select').val()
    var languageSelected = $('#language-selector select').val()
    var key = button.attr('data-key-id')
    editKeyModalValues = {}

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: services.manageKey,
        data: {
            site: site,
            key: key
        },
        success: function (data) {
            if (!data.result || Array.isArray(data.result)) {
                notify('Something went wrong', 'error')
                return
            }

            $('.ui.edit-key.modal>.header').text('Edit field ' + key)

            $('.ui.edit-key.modal form').trigger('reset')
            $('.ui.edit-key.modal input[name="key"]').val(data.result.key)
            $('.ui.edit-key.modal .field.translate').remove()

            // Put the current language in the beginning
            var indexCurrentLanguage = data.result.values.map(function (item) { return item.language }).indexOf(languageSelected)
            if (indexCurrentLanguage !== -1) {
                var itemSelected = data.result.values.splice(indexCurrentLanguage, 1)[0]
                data.result.values.unshift(itemSelected)
            }

            $('.ui.edit-key.modal .form').append(
                data.result.values
                    .map(function (item) {
                        var languageObj = languageList.find(function (l) { return l.id === item.language })
                        return "<div class='field translate'><label>" + (languageObj ? languageObj.title : item.language) + "</label><textarea name='" + item.language + "' rows='3'>" + item.value + "</textarea></div>"
                    }))

            $('.ui.edit-key.modal .form').append(
                data.result.forbidden
                    .map(function (item) {
                        var languageObj = languageList.find(function (l) { return l.id === item.language })
                        return "<div class='field translate'><label>" + (languageObj ? languageObj.title : item.language) + "</label><textarea name='" + item.language + "' rows='3' disabled>" + item.value + "</textarea></div>"
                    }))

            $('.ui.edit-key.modal .button.save').attr('data-original-key-id', key)

            $('.ui.edit-key.modal').modal('show')
            setTimeout(function () { // TODO: Need to solve the modal position issue
                $('.ui.edit-key.modal').modal('refresh')
            }, 1000)

            editKeyModalValues = data.result
        },
        error: function (data) {
            notify('Something went wrong', 'error')
        }
    })

    $('.ui.edit-key.modal').modal('show')
}

function addKey(button) {
    button.prop('disabled', true)
    var site = $('#site-selector select').val()
    var key = ($('.ui.add-key.modal .form input[name="key"]').serializeArray()[0] || {}).value
    var status = $('.ui.add-key.modal .form input[name="status"]').serializeArray()[0] ? true : false
    var values = $('.ui.add-key.modal .form textarea').serializeArray().map(function (v) { return { id: v.name, value: v.value } })
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: services.manageKey,
        data: {
            site: site,
            key: key,
            status: status,
            values: JSON.stringify(values)
        },
        success: function (data) {
            $('#language-selector select').change()
            $('.ui.add-key.modal').modal('hide')
            notify(data.message, 'success')
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    }).always(function () {
        button.prop('disabled', false)
    })
}

function editKey(button) {
    button.prop('disabled', true)
    var originalKey = button.attr('data-original-key-id')
    var site = $('#site-selector select').val()
    var key = $('.ui.edit-key.modal .form input[name="key"]').val()
    var values = $('.ui.edit-key.modal .form textarea:not(:disabled)').serializeArray().map(function (v) { return { id: v.name, value: v.value } })
    $.ajax({
        type: 'PUT',
        dataType: 'json',
        url: services.manageKey,
        data: {
            originalKey: originalKey,
            site: site,
            key: key,
            values: JSON.stringify(values)
        },
        success: function (data) {
            $('#language-selector select').change()
            $('.ui.edit-key.modal').modal('hide')
            notify(data.message, 'success')
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    }).always(function () {
        button.prop('disabled', false)
    })
}

function deleteKey(key) {
    var site = $('#site-selector select').val()
    $.ajax({
        type: 'DELETE',
        dataType: 'json',
        url: services.manageKey + '?' + $.param({ site: site, key: key }),
        success: function (data) {
            $('#language-selector select').change()
            $('.ui.delete-key.modal').modal('hide')
            notify(data.message, 'success')
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    })
}

function getTranslates(site, language) {
    $('#datatable-translate').show()
    $('#custom-table-search').show()
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: services.manageKey,
        data: {
            site: site,
            language: language
        },
        success: function (data) {
            datatable.clear()

            datatable.rows.add(
                data.result.map(function (r) {
                    return {
                        key: r.key,
                        createdTime: r.createdTime,
                        modifiedTime: r.modifiedTime,
                        value: r.value,
                        actions: {
                            keyId: r.key,
                            status: r.status
                        }
                    }
                })
            )

            datatable.columns.adjust().draw()

            $('.edit-key-button').on('click', function () {
                openEditKeyModal($(this))
            })
            $('.delete-key-button').on('click', function () {
                $('.ui.delete-key.modal .key').text($(this).attr('data-key-id'))
                $('.ui.delete-key.modal').modal('show')
            })
            $('.publish-key-button').on('click', function () {
                openPublishModal($(this))
            })
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    })
}

function publishKey(button) {
    var site = $('#site-selector select').val()
    var language = button.attr('data-key-language')
    var key = button.attr('data-key-id')
    var status = button.attr('data-key-status')
    $.ajax({
        type: 'PUT',
        dataType: 'json',
        url: services.publishKey,
        data: {
            site: site,
            key: key,
            language: language,
            status: status
        },
        success: function (data) {
            $('#language-selector select').change()
            $('.ui.publish-key.modal').modal('hide')
            notify(data.message, 'success')
        },
        error: function (data) {
            notify(data && data.responseJSON && data.responseJSON.message, 'error')
        }
    })
}

var languageList = [
    { id: "af-NA", title: "Afrikaans (Namibië) (af-NA)" },
    { id: "af-ZA", title: "Afrikaans (Suid-Afrika) (af-ZA)" },
    { id: "af", title: "Afrikaans (af)" },
    { id: "agq-CM", title: "Aghem (Kàmàlûŋ) (agq-CM)" },
    { id: "agq", title: "Aghem (agq)" },
    { id: "ak-GH", title: "Akan (Gaana) (ak-GH)" },
    { id: "ak", title: "Akan (ak)" },
    { id: "id-ID", title: "Bahasa Indonesia (Indonesia) (id-ID)" },
    { id: "id", title: "Bahasa Indonesia (id)" },
    { id: "kde-TZ", title: "Chimakonde (Tanzania) (kde-TZ)" },
    { id: "kde", title: "Chimakonde (kde)" },
    { id: "cu-RU", title: "Church Slavic (Russia) (cu-RU)" },
    { id: "cu", title: "Church Slavic (cu)" },
    { id: "cy-GB", title: "Cymraeg (Y Deyrnas Unedig) (cy-GB)" },
    { id: "cy", title: "Cymraeg (cy)" },
    { id: "de-BE", title: "Deutsch (Belgien) (de-BE)" },
    { id: "de-DE", title: "Deutsch (Deutschland) (de-DE)" },
    { id: "de-IT", title: "Deutsch (Italien) (de-IT)" },
    { id: "de-LI", title: "Deutsch (Liechtenstein) (de-LI)" },
    { id: "de-LU", title: "Deutsch (Luxemburg) (de-LU)" },
    { id: "de-CH", title: "Deutsch (Schweiz) (de-CH)" },
    { id: "de", title: "Deutsch (de)" },
    { id: "de-AT", title: "Deutsch (Österreich) (de-AT)" },
    { id: "luo-KE", title: "Dholuo (Kenya) (luo-KE)" },
    { id: "luo", title: "Dholuo (luo)" },
    { id: "guz-KE", title: "Ekegusii (Kenya) (guz-KE)" },
    { id: "guz", title: "Ekegusii (guz)" },
    { id: "en-AS", title: "English (American Samoa) (en-AS)" },
    { id: "en-AI", title: "English (Anguilla) (en-AI)" },
    { id: "en-AG", title: "English (Antigua & Barbuda) (en-AG)" },
    { id: "en-AU", title: "English (Australia) (en-AU)" },
    { id: "en-AT", title: "English (Austria) (en-AT)" },
    { id: "en-BS", title: "English (Bahamas) (en-BS)" },
    { id: "en-BB", title: "English (Barbados) (en-BB)" },
    { id: "en-BE", title: "English (Belgium) (en-BE)" },
    { id: "en-BZ", title: "English (Belize) (en-BZ)" },
    { id: "en-BM", title: "English (Bermuda) (en-BM)" },
    { id: "en-BW", title: "English (Botswana) (en-BW)" },
    { id: "en-IO", title: "English (British Indian Ocean Territory) (en-IO)" },
    { id: "en-VG", title: "English (British Virgin Islands) (en-VG)" },
    { id: "en-BI", title: "English (Burundi) (en-BI)" },
    { id: "en-CM", title: "English (Cameroon) (en-CM)" },
    { id: "en-CA", title: "English (Canada) (en-CA)" },
    { id: "en-KY", title: "English (Cayman Islands) (en-KY)" },
    { id: "en-CX", title: "English (Christmas Island) (en-CX)" },
    { id: "en-CC", title: "English (Cocos (Keeling) Islands) (en-CC)" },
    { id: "en-CK", title: "English (Cook Islands) (en-CK)" },
    { id: "en-CY", title: "English (Cyprus) (en-CY)" },
    { id: "en-DK", title: "English (Denmark) (en-DK)" },
    { id: "en-DG", title: "English (Diego Garcia) (en-DG)" },
    { id: "en-DM", title: "English (Dominica) (en-DM)" },
    { id: "en-ER", title: "English (Eritrea) (en-ER)" },
    { id: "en-150", title: "English (Europe) (en-150)" },
    { id: "en-FK", title: "English (Falkland Islands) (en-FK)" },
    { id: "en-FJ", title: "English (Fiji) (en-FJ)" },
    { id: "en-FI", title: "English (Finland) (en-FI)" },
    { id: "en-GM", title: "English (Gambia) (en-GM)" },
    { id: "en-DE", title: "English (Germany) (en-DE)" },
    { id: "en-GH", title: "English (Ghana) (en-GH)" },
    { id: "en-GI", title: "English (Gibraltar) (en-GI)" },
    { id: "en-GD", title: "English (Grenada) (en-GD)" },
    { id: "en-GU", title: "English (Guam) (en-GU)" },
    { id: "en-GG", title: "English (Guernsey) (en-GG)" },
    { id: "en-GY", title: "English (Guyana) (en-GY)" },
    { id: "en-HK", title: "English (Hong Kong SAR China) (en-HK)" },
    { id: "en-IN", title: "English (India) (en-IN)" },
    { id: "en-IE", title: "English (Ireland) (en-IE)" },
    { id: "en-IM", title: "English (Isle of Man) (en-IM)" },
    { id: "en-IL", title: "English (Israel) (en-IL)" },
    { id: "en-JM", title: "English (Jamaica) (en-JM)" },
    { id: "en-JE", title: "English (Jersey) (en-JE)" },
    { id: "en-KE", title: "English (Kenya) (en-KE)" },
    { id: "en-KI", title: "English (Kiribati) (en-KI)" },
    { id: "en-LS", title: "English (Lesotho) (en-LS)" },
    { id: "en-LR", title: "English (Liberia) (en-LR)" },
    { id: "en-MO", title: "English (Macau SAR China) (en-MO)" },
    { id: "en-MG", title: "English (Madagascar) (en-MG)" },
    { id: "en-MW", title: "English (Malawi) (en-MW)" },
    { id: "en-MY", title: "English (Malaysia) (en-MY)" },
    { id: "en-MT", title: "English (Malta) (en-MT)" },
    { id: "en-MH", title: "English (Marshall Islands) (en-MH)" },
    { id: "en-MU", title: "English (Mauritius) (en-MU)" },
    { id: "en-FM", title: "English (Micronesia) (en-FM)" },
    { id: "en-MS", title: "English (Montserrat) (en-MS)" },
    { id: "en-NA", title: "English (Namibia) (en-NA)" },
    { id: "en-NR", title: "English (Nauru) (en-NR)" },
    { id: "en-NL", title: "English (Netherlands) (en-NL)" },
    { id: "en-NZ", title: "English (New Zealand) (en-NZ)" },
    { id: "en-NG", title: "English (Nigeria) (en-NG)" },
    { id: "en-NU", title: "English (Niue) (en-NU)" },
    { id: "en-NF", title: "English (Norfolk Island) (en-NF)" },
    { id: "en-MP", title: "English (Northern Mariana Islands) (en-MP)" },
    { id: "en-PK", title: "English (Pakistan) (en-PK)" },
    { id: "en-PW", title: "English (Palau) (en-PW)" },
    { id: "en-PG", title: "English (Papua New Guinea) (en-PG)" },
    { id: "en-PH", title: "English (Philippines) (en-PH)" },
    { id: "en-PN", title: "English (Pitcairn Islands) (en-PN)" },
    { id: "en-PR", title: "English (Puerto Rico) (en-PR)" },
    { id: "en-RW", title: "English (Rwanda) (en-RW)" },
    { id: "en-WS", title: "English (Samoa) (en-WS)" },
    { id: "en-SC", title: "English (Seychelles) (en-SC)" },
    { id: "en-SL", title: "English (Sierra Leone) (en-SL)" },
    { id: "en-SG", title: "English (Singapore) (en-SG)" },
    { id: "en-SX", title: "English (Sint Maarten) (en-SX)" },
    { id: "en-SI", title: "English (Slovenia) (en-SI)" },
    { id: "en-SB", title: "English (Solomon Islands) (en-SB)" },
    { id: "en-ZA", title: "English (South Africa) (en-ZA)" },
    { id: "en-SS", title: "English (South Sudan) (en-SS)" },
    { id: "en-SH", title: "English (St. Helena) (en-SH)" },
    { id: "en-KN", title: "English (St. Kitts & Nevis) (en-KN)" },
    { id: "en-LC", title: "English (St. Lucia) (en-LC)" },
    { id: "en-VC", title: "English (St. Vincent & Grenadines) (en-VC)" },
    { id: "en-SD", title: "English (Sudan) (en-SD)" },
    { id: "en-SZ", title: "English (Swaziland) (en-SZ)" },
    { id: "en-SE", title: "English (Sweden) (en-SE)" },
    { id: "en-CH", title: "English (Switzerland) (en-CH)" },
    { id: "en-TZ", title: "English (Tanzania) (en-TZ)" },
    { id: "en-TK", title: "English (Tokelau) (en-TK)" },
    { id: "en-TO", title: "English (Tonga) (en-TO)" },
    { id: "en-TT", title: "English (Trinidad & Tobago) (en-TT)" },
    { id: "en-TC", title: "English (Turks & Caicos Islands) (en-TC)" },
    { id: "en-TV", title: "English (Tuvalu) (en-TV)" },
    { id: "en-UM", title: "English (U.S. Outlying Islands) (en-UM)" },
    { id: "en-VI", title: "English (U.S. Virgin Islands) (en-VI)" },
    { id: "en-UG", title: "English (Uganda) (en-UG)" },
    { id: "en-GB", title: "English (United Kingdom) (en-GB)" },
    { id: "en-US", title: "English (United States) (en-US)" },
    { id: "en-US-POSIX", title: "English (United States, Computer) (en-US-POSIX)" },
    { id: "en-VU", title: "English (Vanuatu) (en-VU)" },
    { id: "en-001", title: "English (World) (en-001)" },
    { id: "en-ZM", title: "English (Zambia) (en-ZM)" },
    { id: "en-ZW", title: "English (Zimbabwe) (en-ZW)" },
    { id: "en", title: "English (en)" },
    { id: "ee-GH", title: "Eʋegbe (Ghana nutome) (ee-GH)" },
    { id: "ee-TG", title: "Eʋegbe (Togo nutome) (ee-TG)" },
    { id: "ee", title: "Eʋegbe (ee)" },
    { id: "fil-PH", title: "Filipino (Pilipinas) (fil-PH)" },
    { id: "fil", title: "Filipino (fil)" },
    { id: "fy-NL", title: "Frysk (Nederlân) (fy-NL)" },
    { id: "fy", title: "Frysk (fy)" },
    { id: "ga", title: "Gaeilge (ga)" },
    { id: "ga-IE", title: "Gaeilge (Éire) (ga-IE)" },
    { id: "gv-IM", title: "Gaelg (Ellan Vannin) (gv-IM)" },
    { id: "gv", title: "Gaelg (gv)" },
    { id: "ki-KE", title: "Gikuyu (Kenya) (ki-KE)" },
    { id: "ki", title: "Gikuyu (ki)" },
    { id: "gd-GB", title: "Gàidhlig (An Rìoghachd Aonaichte) (gd-GB)" },
    { id: "gd", title: "Gàidhlig (gd)" },
    { id: "ha-GH", title: "Hausa (Gana) (ha-GH)" },
    { id: "ha-NG", title: "Hausa (Najeriya) (ha-NG)" },
    { id: "ha-NE", title: "Hausa (Nijar) (ha-NE)" },
    { id: "ha", title: "Hausa (ha)" },
    { id: "bez-TZ", title: "Hibena (Hutanzania) (bez-TZ)" },
    { id: "bez", title: "Hibena (bez)" },
    { id: "bem-ZM", title: "Ichibemba (Zambia) (bem-ZM)" },
    { id: "bem", title: "Ichibemba (bem)" },
    { id: "ig-NG", title: "Igbo (Naịjịrịa) (ig-NG)" },
    { id: "ig", title: "Igbo (ig)" },
    { id: "rn-BI", title: "Ikirundi (Uburundi) (rn-BI)" },
    { id: "rn", title: "Ikirundi (rn)" },
    { id: "sbp-TZ", title: "Ishisangu (Tansaniya) (sbp-TZ)" },
    { id: "sbp", title: "Ishisangu (sbp)" },
    { id: "kln-KE", title: "Kalenjin (Emetab Kenya) (kln-KE)" },
    { id: "kln", title: "Kalenjin (kln)" },
    { id: "naq-NA", title: "Khoekhoegowab (Namibiab) (naq-NA)" },
    { id: "naq", title: "Khoekhoegowab (naq)" },
    { id: "rof-TZ", title: "Kihorombo (Tanzania) (rof-TZ)" },
    { id: "rof", title: "Kihorombo (rof)" },
    { id: "kam-KE", title: "Kikamba (Kenya) (kam-KE)" },
    { id: "kam", title: "Kikamba (kam)" },
    { id: "jmc-TZ", title: "Kimachame (Tanzania) (jmc-TZ)" },
    { id: "jmc", title: "Kimachame (jmc)" },
    { id: "rw-RW", title: "Kinyarwanda (U Rwanda) (rw-RW)" },
    { id: "rw", title: "Kinyarwanda (rw)" },
    { id: "asa-TZ", title: "Kipare (Tadhania) (asa-TZ)" },
    { id: "asa", title: "Kipare (asa)" },
    { id: "rwk-TZ", title: "Kiruwa (Tanzania) (rwk-TZ)" },
    { id: "rwk", title: "Kiruwa (rwk)" },
    { id: "saq-KE", title: "Kisampur (Kenya) (saq-KE)" },
    { id: "saq", title: "Kisampur (saq)" },
    { id: "ksb-TZ", title: "Kishambaa (Tanzania) (ksb-TZ)" },
    { id: "ksb", title: "Kishambaa (ksb)" },
    { id: "sw-CD", title: "Kiswahili (Jamhuri ya Kidemokrasia ya Kongo) (sw-CD)" },
    { id: "sw-KE", title: "Kiswahili (Kenya) (sw-KE)" },
    { id: "sw-TZ", title: "Kiswahili (Tanzania) (sw-TZ)" },
    { id: "sw-UG", title: "Kiswahili (Uganda) (sw-UG)" },
    { id: "sw", title: "Kiswahili (sw)" },
    { id: "dav-KE", title: "Kitaita (Kenya) (dav-KE)" },
    { id: "dav", title: "Kitaita (dav)" },
    { id: "teo-KE", title: "Kiteso (Kenia) (teo-KE)" },
    { id: "teo-UG", title: "Kiteso (Uganda) (teo-UG)" },
    { id: "teo", title: "Kiteso (teo)" },
    { id: "khq-ML", title: "Koyra ciini (Maali) (khq-ML)" },
    { id: "khq", title: "Koyra ciini (khq)" },
    { id: "ses-ML", title: "Koyraboro senni (Maali) (ses-ML)" },
    { id: "ses", title: "Koyraboro senni (ses)" },
    { id: "vun-TZ", title: "Kyivunjo (Tanzania) (vun-TZ)" },
    { id: "vun", title: "Kyivunjo (vun)" },
    { id: "ksh-DE", title: "Kölsch (Doütschland) (ksh-DE)" },
    { id: "ksh", title: "Kölsch (ksh)" },
    { id: "ebu-KE", title: "Kĩembu (Kenya) (ebu-KE)" },
    { id: "ebu", title: "Kĩembu (ebu)" },
    { id: "mer-KE", title: "Kĩmĩrũ (Kenya) (mer-KE)" },
    { id: "mer", title: "Kĩmĩrũ (mer)" },
    { id: "lag-TZ", title: "Kɨlaangi (Taansanía) (lag-TZ)" },
    { id: "lag", title: "Kɨlaangi (lag)" },
    { id: "lkt-US", title: "Lakȟólʼiyapi (Mílahaŋska Tȟamákȟočhe) (lkt-US)" },
    { id: "lkt", title: "Lakȟólʼiyapi (lkt)" },
    { id: "nds-DE", title: "Low German (Germany) (nds-DE)" },
    { id: "nds-NL", title: "Low German (Netherlands) (nds-NL)" },
    { id: "nds", title: "Low German (nds)" },
    { id: "lg-UG", title: "Luganda (Yuganda) (lg-UG)" },
    { id: "lg", title: "Luganda (lg)" },
    { id: "luy-KE", title: "Luluhia (Kenya) (luy-KE)" },
    { id: "luy", title: "Luluhia (luy)" },
    { id: "lb-LU", title: "Lëtzebuergesch (Lëtzebuerg) (lb-LU)" },
    { id: "lb", title: "Lëtzebuergesch (lb)" },
    { id: "mua-CM", title: "MUNDAŊ (kameruŋ) (mua-CM)" },
    { id: "mua", title: "MUNDAŊ (mua)" },
    { id: "mas-KE", title: "Maa (Kenya) (mas-KE)" },
    { id: "mas-TZ", title: "Maa (Tansania) (mas-TZ)" },
    { id: "mas", title: "Maa (mas)" },
    { id: "mgh-MZ", title: "Makua (Umozambiki) (mgh-MZ)" },
    { id: "mgh", title: "Makua (mgh)" },
    { id: "mg-MG", title: "Malagasy (Madagasikara) (mg-MG)" },
    { id: "mg", title: "Malagasy (mg)" },
    { id: "mt-MT", title: "Malti (Malta) (mt-MT)" },
    { id: "mt", title: "Malti (mt)" },
    { id: "ms-BN", title: "Melayu (Brunei) (ms-BN)" },
    { id: "ms-MY", title: "Melayu (Malaysia) (ms-MY)" },
    { id: "ms-SG", title: "Melayu (Singapura) (ms-SG)" },
    { id: "ms", title: "Melayu (ms)" },
    { id: "jgo-CM", title: "Ndaꞌa (Kamɛlûn) (jgo-CM)" },
    { id: "jgo", title: "Ndaꞌa (jgo)" },
    { id: "nl-AW", title: "Nederlands (Aruba) (nl-AW)" },
    { id: "nl-BE", title: "Nederlands (België) (nl-BE)" },
    { id: "nl-BQ", title: "Nederlands (Caribisch Nederland) (nl-BQ)" },
    { id: "nl-CW", title: "Nederlands (Curaçao) (nl-CW)" },
    { id: "nl-NL", title: "Nederlands (Nederland) (nl-NL)" },
    { id: "nl-SX", title: "Nederlands (Sint-Maarten) (nl-SX)" },
    { id: "nl-SR", title: "Nederlands (Suriname) (nl-SR)" },
    { id: "nl", title: "Nederlands (nl)" },
    { id: "xog-UG", title: "Olusoga (Yuganda) (xog-UG)" },
    { id: "xog", title: "Olusoga (xog)" },
    { id: "om-ET", title: "Oromoo (Itoophiyaa) (om-ET)" },
    { id: "om-KE", title: "Oromoo (Keeniyaa) (om-KE)" },
    { id: "om", title: "Oromoo (om)" },
    { id: "ff-GN", title: "Pulaar (Gine) (ff-GN)" },
    { id: "ff-CM", title: "Pulaar (Kameruun) (ff-CM)" },
    { id: "ff-MR", title: "Pulaar (Muritani) (ff-MR)" },
    { id: "ff-SN", title: "Pulaar (Senegaal) (ff-SN)" },
    { id: "ff", title: "Pulaar (ff)" },
    { id: "cgg-UG", title: "Rukiga (Uganda) (cgg-UG)" },
    { id: "cgg", title: "Rukiga (cgg)" },
    { id: "qu-BO", title: "Runasimi (Bolivia) (qu-BO)" },
    { id: "qu-EC", title: "Runasimi (Ecuador) (qu-EC)" },
    { id: "qu-PE", title: "Runasimi (Perú) (qu-PE)" },
    { id: "qu", title: "Runasimi (qu)" },
    { id: "nyn-UG", title: "Runyankore (Uganda) (nyn-UG)" },
    { id: "nyn", title: "Runyankore (nyn)" },
    { id: "gsw-FR", title: "Schwiizertüütsch (Frankriich) (gsw-FR)" },
    { id: "gsw-LI", title: "Schwiizertüütsch (Liächteschtäi) (gsw-LI)" },
    { id: "gsw-CH", title: "Schwiizertüütsch (Schwiiz) (gsw-CH)" },
    { id: "gsw", title: "Schwiizertüütsch (gsw)" },
    { id: "nnh-CM", title: "Shwóŋò ngiembɔɔn (Kàmalûm) (nnh-CM)" },
    { id: "nnh", title: "Shwóŋò ngiembɔɔn (nnh)" },
    { id: "so-ET", title: "Soomaali (Itoobiya) (so-ET)" },
    { id: "so-DJ", title: "Soomaali (Jabuuti) (so-DJ)" },
    { id: "so-KE", title: "Soomaali (Kiiniya) (so-KE)" },
    { id: "so-SO", title: "Soomaali (Soomaaliya) (so-SO)" },
    { id: "so", title: "Soomaali (so)" },
    { id: "sg-CF", title: "Sängö (Ködörösêse tî Bêafrîka) (sg-CF)" },
    { id: "sg", title: "Sängö (sg)" },
    { id: "tzm-MA", title: "Tamaziɣt n laṭlaṣ (Meṛṛuk) (tzm-MA)" },
    { id: "tzm", title: "Tamaziɣt n laṭlaṣ (tzm)" },
    { id: "kab-DZ", title: "Taqbaylit (Lezzayer) (kab-DZ)" },
    { id: "kab", title: "Taqbaylit (kab)" },
    { id: "twq-NE", title: "Tasawaq senni (Nižer) (twq-NE)" },
    { id: "twq", title: "Tasawaq senni (twq)" },
    { id: "shi-Latn", title: "Tashelḥiyt (Latin) (shi-Latn)" },
    { id: "shi-Latn-MA", title: "Tashelḥiyt (Latin, lmɣrib) (shi-Latn-MA)" },
    { id: "nus-SS", title: "Thok Nath (South Sudan) (nus-SS)" },
    { id: "nus", title: "Thok Nath (nus)" },
    { id: "vi-VN", title: "Tiếng Việt (Việt Nam) (vi-VN)" },
    { id: "vi", title: "Tiếng Việt (vi)" },
    { id: "lu-CD", title: "Tshiluba (Ditunga wa Kongu) (lu-CD)" },
    { id: "lu", title: "Tshiluba (lu)" },
    { id: "tr-CY", title: "Türkçe (Kıbrıs) (tr-CY)" },
    { id: "tr-TR", title: "Türkçe (Türkiye) (tr-TR)" },
    { id: "tr", title: "Türkçe (tr)" },
    { id: "vai-Latn", title: "Vai (Latin) (vai-Latn)" },
    { id: "vai-Latn-LR", title: "Vai (Latin, Laibhiya) (vai-Latn-LR)" },
    { id: "vo-001", title: "Volapük (World) (vo-001)" },
    { id: "vo", title: "Volapük (vo)" },
    { id: "wae-CH", title: "Walser (Schwiz) (wae-CH)" },
    { id: "wae", title: "Walser (wae)" },
    { id: "wo-SN", title: "Wolof (Senegaal) (wo-SN)" },
    { id: "wo", title: "Wolof (wo)" },
    { id: "yi", title: "Yiddish (yi)" },
    { id: "yi-001", title: "Yiddish (וועלט) (yi-001)" },
    { id: "dje-NE", title: "Zarmaciine (Nižer) (dje-NE)" },
    { id: "dje", title: "Zarmaciine (dje)" },
    { id: "smn-FI", title: "anarâškielâ (Suomâ) (smn-FI)" },
    { id: "smn", title: "anarâškielâ (smn)" },
    { id: "ast-ES", title: "asturianu (España) (ast-ES)" },
    { id: "ast", title: "asturianu (ast)" },
    { id: "az", title: "azərbaycan (az)" },
    { id: "az-Latn", title: "azərbaycan (latın) (az-Latn)" },
    { id: "az-Latn-AZ", title: "azərbaycan (latın, Azərbaycan) (az-Latn-AZ)" },
    { id: "bm-ML", title: "bamanakan (Mali) (bm-ML)" },
    { id: "bm", title: "bamanakan (bm)" },
    { id: "bs", title: "bosanski (bs)" },
    { id: "bs-Latn", title: "bosanski (latinica) (bs-Latn)" },
    { id: "bs-Latn-BA", title: "bosanski (latinica, Bosna i Hercegovina) (bs-Latn-BA)" },
    { id: "br-FR", title: "brezhoneg (Frañs) (br-FR)" },
    { id: "br", title: "brezhoneg (br)" },
    { id: "ca-AD", title: "català (Andorra) (ca-AD)" },
    { id: "ca-ES", title: "català (Espanya) (ca-ES)" },
    { id: "ca-ES-VALENCIA", title: "català (Espanya, valencià) (ca-ES-VALENCIA)" },
    { id: "ca-FR", title: "català (França) (ca-FR)" },
    { id: "ca-IT", title: "català (Itàlia) (ca-IT)" },
    { id: "ca", title: "català (ca)" },
    { id: "sn-ZW", title: "chiShona (Zimbabwe) (sn-ZW)" },
    { id: "sn", title: "chiShona (sn)" },
    { id: "da-DK", title: "dansk (Danmark) (da-DK)" },
    { id: "da-GL", title: "dansk (Grønland) (da-GL)" },
    { id: "da", title: "dansk (da)" },
    { id: "se-NO", title: "davvisámegiella (Norga) (se-NO)" },
    { id: "se-SE", title: "davvisámegiella (Ruoŧŧa) (se-SE)" },
    { id: "se-FI", title: "davvisámegiella (Suopma) (se-FI)" },
    { id: "se", title: "davvisámegiella (se)" },
    { id: "dsb-DE", title: "dolnoserbšćina (Nimska) (dsb-DE)" },
    { id: "dsb", title: "dolnoserbšćina (dsb)" },
    { id: "dua-CM", title: "duálá (Cameroun) (dua-CM)" },
    { id: "dua", title: "duálá (dua)" },
    { id: "et-EE", title: "eesti (Eesti) (et-EE)" },
    { id: "et", title: "eesti (et)" },
    { id: "es-AR", title: "español (Argentina) (es-AR)" },
    { id: "es-BZ", title: "español (Belice) (es-BZ)" },
    { id: "es-BO", title: "español (Bolivia) (es-BO)" },
    { id: "es-BR", title: "español (Brasil) (es-BR)" },
    { id: "es-IC", title: "español (Canarias) (es-IC)" },
    { id: "es-EA", title: "español (Ceuta y Melilla) (es-EA)" },
    { id: "es-CL", title: "español (Chile) (es-CL)" },
    { id: "es-CO", title: "español (Colombia) (es-CO)" },
    { id: "es-CR", title: "español (Costa Rica) (es-CR)" },
    { id: "es-CU", title: "español (Cuba) (es-CU)" },
    { id: "es-EC", title: "español (Ecuador) (es-EC)" },
    { id: "es-SV", title: "español (El Salvador) (es-SV)" },
    { id: "es-ES", title: "español (España) (es-ES)" },
    { id: "es-US", title: "español (Estados Unidos) (es-US)" },
    { id: "es-PH", title: "español (Filipinas) (es-PH)" },
    { id: "es-GT", title: "español (Guatemala) (es-GT)" },
    { id: "es-GQ", title: "español (Guinea Ecuatorial) (es-GQ)" },
    { id: "es-HN", title: "español (Honduras) (es-HN)" },
    { id: "es-419", title: "español (Latinoamérica) (es-419)" },
    { id: "es-MX", title: "español (México) (es-MX)" },
    { id: "es-NI", title: "español (Nicaragua) (es-NI)" },
    { id: "es-PA", title: "español (Panamá) (es-PA)" },
    { id: "es-PY", title: "español (Paraguay) (es-PY)" },
    { id: "es-PE", title: "español (Perú) (es-PE)" },
    { id: "es-PR", title: "español (Puerto Rico) (es-PR)" },
    { id: "es-DO", title: "español (República Dominicana) (es-DO)" },
    { id: "es-UY", title: "español (Uruguay) (es-UY)" },
    { id: "es-VE", title: "español (Venezuela) (es-VE)" },
    { id: "es", title: "español (es)" },
    { id: "eo-001", title: "esperanto (World) (eo-001)" },
    { id: "eo", title: "esperanto (eo)" },
    { id: "eu-ES", title: "euskara (Espainia) (eu-ES)" },
    { id: "eu", title: "euskara (eu)" },
    { id: "ewo-CM", title: "ewondo (Kamərún) (ewo-CM)" },
    { id: "ewo", title: "ewondo (ewo)" },
    { id: "fr-DZ", title: "français (Algérie) (fr-DZ)" },
    { id: "fr-BE", title: "français (Belgique) (fr-BE)" },
    { id: "fr-BF", title: "français (Burkina Faso) (fr-BF)" },
    { id: "fr-BI", title: "français (Burundi) (fr-BI)" },
    { id: "fr-BJ", title: "français (Bénin) (fr-BJ)" },
    { id: "fr-CM", title: "français (Cameroun) (fr-CM)" },
    { id: "fr-CA", title: "français (Canada) (fr-CA)" },
    { id: "fr-KM", title: "français (Comores) (fr-KM)" },
    { id: "fr-CG", title: "français (Congo-Brazzaville) (fr-CG)" },
    { id: "fr-CD", title: "français (Congo-Kinshasa) (fr-CD)" },
    { id: "fr-CI", title: "français (Côte d’Ivoire) (fr-CI)" },
    { id: "fr-DJ", title: "français (Djibouti) (fr-DJ)" },
    { id: "fr-FR", title: "français (France) (fr-FR)" },
    { id: "fr-GA", title: "français (Gabon) (fr-GA)" },
    { id: "fr-GP", title: "français (Guadeloupe) (fr-GP)" },
    { id: "fr-GQ", title: "français (Guinée équatoriale) (fr-GQ)" },
    { id: "fr-GN", title: "français (Guinée) (fr-GN)" },
    { id: "fr-GF", title: "français (Guyane française) (fr-GF)" },
    { id: "fr-HT", title: "français (Haïti) (fr-HT)" },
    { id: "fr-RE", title: "français (La Réunion) (fr-RE)" },
    { id: "fr-LU", title: "français (Luxembourg) (fr-LU)" },
    { id: "fr-MG", title: "français (Madagascar) (fr-MG)" },
    { id: "fr-ML", title: "français (Mali) (fr-ML)" },
    { id: "fr-MA", title: "français (Maroc) (fr-MA)" },
    { id: "fr-MQ", title: "français (Martinique) (fr-MQ)" },
    { id: "fr-MU", title: "français (Maurice) (fr-MU)" },
    { id: "fr-MR", title: "français (Mauritanie) (fr-MR)" },
    { id: "fr-YT", title: "français (Mayotte) (fr-YT)" },
    { id: "fr-MC", title: "français (Monaco) (fr-MC)" },
    { id: "fr-NE", title: "français (Niger) (fr-NE)" },
    { id: "fr-NC", title: "français (Nouvelle-Calédonie) (fr-NC)" },
    { id: "fr-PF", title: "français (Polynésie française) (fr-PF)" },
    { id: "fr-RW", title: "français (Rwanda) (fr-RW)" },
    { id: "fr-CF", title: "français (République centrafricaine) (fr-CF)" },
    { id: "fr-BL", title: "français (Saint-Barthélemy) (fr-BL)" },
    { id: "fr-MF", title: "français (Saint-Martin) (fr-MF)" },
    { id: "fr-PM", title: "français (Saint-Pierre-et-Miquelon) (fr-PM)" },
    { id: "fr-SC", title: "français (Seychelles) (fr-SC)" },
    { id: "fr-CH", title: "français (Suisse) (fr-CH)" },
    { id: "fr-SY", title: "français (Syrie) (fr-SY)" },
    { id: "fr-SN", title: "français (Sénégal) (fr-SN)" },
    { id: "fr-TD", title: "français (Tchad) (fr-TD)" },
    { id: "fr-TG", title: "français (Togo) (fr-TG)" },
    { id: "fr-TN", title: "français (Tunisie) (fr-TN)" },
    { id: "fr-VU", title: "français (Vanuatu) (fr-VU)" },
    { id: "fr-WF", title: "français (Wallis-et-Futuna) (fr-WF)" },
    { id: "fr", title: "français (fr)" },
    { id: "fur-IT", title: "furlan (Italie) (fur-IT)" },
    { id: "fur", title: "furlan (fur)" },
    { id: "fo-DK", title: "føroyskt (Danmark) (fo-DK)" },
    { id: "fo-FO", title: "føroyskt (Føroyar) (fo-FO)" },
    { id: "fo", title: "føroyskt (fo)" },
    { id: "gl-ES", title: "galego (España) (gl-ES)" },
    { id: "gl", title: "galego (gl)" },
    { id: "hsb-DE", title: "hornjoserbšćina (Němska) (hsb-DE)" },
    { id: "hsb", title: "hornjoserbšćina (hsb)" },
    { id: "hr-BA", title: "hrvatski (Bosna i Hercegovina) (hr-BA)" },
    { id: "hr-HR", title: "hrvatski (Hrvatska) (hr-HR)" },
    { id: "hr", title: "hrvatski (hr)" },
    { id: "nd-ZW", title: "isiNdebele (Zimbabwe) (nd-ZW)" },
    { id: "nd", title: "isiNdebele (nd)" },
    { id: "zu-ZA", title: "isiZulu (iNingizimu Afrika) (zu-ZA)" },
    { id: "zu", title: "isiZulu (zu)" },
    { id: "it-VA", title: "italiano (Città del Vaticano) (it-VA)" },
    { id: "it-IT", title: "italiano (Italia) (it-IT)" },
    { id: "it-SM", title: "italiano (San Marino) (it-SM)" },
    { id: "it-CH", title: "italiano (Svizzera) (it-CH)" },
    { id: "it", title: "italiano (it)" },
    { id: "dyo-SN", title: "joola (Senegal) (dyo-SN)" },
    { id: "dyo", title: "joola (dyo)" },
    { id: "kea-CV", title: "kabuverdianu (Kabu Verdi) (kea-CV)" },
    { id: "kea", title: "kabuverdianu (kea)" },
    { id: "kkj-CM", title: "kakɔ (Kamɛrun) (kkj-CM)" },
    { id: "kkj", title: "kakɔ (kkj)" },
    { id: "kl-GL", title: "kalaallisut (Kalaallit Nunaat) (kl-GL)" },
    { id: "kl", title: "kalaallisut (kl)" },
    { id: "kw-GB", title: "kernewek (Rywvaneth Unys) (kw-GB)" },
    { id: "kw", title: "kernewek (kw)" },
    { id: "mfe-MU", title: "kreol morisien (Moris) (mfe-MU)" },
    { id: "mfe", title: "kreol morisien (mfe)" },
    { id: "lv-LV", title: "latviešu (Latvija) (lv-LV)" },
    { id: "lv", title: "latviešu (lv)" },
    { id: "to-TO", title: "lea fakatonga (Tonga) (to-TO)" },
    { id: "to", title: "lea fakatonga (to)" },
    { id: "lt-LT", title: "lietuvių (Lietuva) (lt-LT)" },
    { id: "lt", title: "lietuvių (lt)" },
    { id: "ln-AO", title: "lingála (Angóla) (ln-AO)" },
    { id: "ln-CG", title: "lingála (Kongo) (ln-CG)" },
    { id: "ln-CF", title: "lingála (Repibiki ya Afríka ya Káti) (ln-CF)" },
    { id: "ln-CD", title: "lingála (Republíki ya Kongó Demokratíki) (ln-CD)" },
    { id: "ln", title: "lingála (ln)" },
    { id: "hu-HU", title: "magyar (Magyarország) (hu-HU)" },
    { id: "hu", title: "magyar (hu)" },
    { id: "mgo-CM", title: "metaʼ (Kamalun) (mgo-CM)" },
    { id: "mgo", title: "metaʼ (mgo)" },
    { id: "nmg-CM", title: "nmg (Kamerun) (nmg-CM)" },
    { id: "nmg", title: "nmg (nmg)" },
    { id: "nn-NO", title: "norsk (Noreg, nynorsk) (nn-NO)" },
    { id: "no-NO", title: "norsk (Norge) (no-NO)" },
    { id: "no", title: "norsk (no)" },
    { id: "nb-NO", title: "norsk bokmål (Norge) (nb-NO)" },
    { id: "nb-SJ", title: "norsk bokmål (Svalbard og Jan Mayen) (nb-SJ)" },
    { id: "nb", title: "norsk bokmål (nb)" },
    { id: "yav-CM", title: "nuasue (Kemelún) (yav-CM)" },
    { id: "yav", title: "nuasue (yav)" },
    { id: "nn-NO", title: "nynorsk (Noreg) (nn-NO)" },
    { id: "nn", title: "nynorsk (nn)" },
    { id: "uz-Latn", title: "o‘zbek (lotin) (uz-Latn)" },
    { id: "uz-Latn-UZ", title: "o‘zbek (lotin, Oʻzbekiston) (uz-Latn-UZ)" },
    { id: "uz", title: "o‘zbek (uz)" },
    { id: "pl-PL", title: "polski (Polska) (pl-PL)" },
    { id: "pl", title: "polski (pl)" },
    { id: "pt-AO", title: "português (Angola) (pt-AO)" },
    { id: "pt-BR", title: "português (Brasil) (pt-BR)" },
    { id: "pt-CV", title: "português (Cabo Verde) (pt-CV)" },
    { id: "pt-GQ", title: "português (Guiné Equatorial) (pt-GQ)" },
    { id: "pt-GW", title: "português (Guiné-Bissau) (pt-GW)" },
    { id: "pt-LU", title: "português (Luxemburgo) (pt-LU)" },
    { id: "pt-MO", title: "português (Macau, RAE da China) (pt-MO)" },
    { id: "pt-MZ", title: "português (Moçambique) (pt-MZ)" },
    { id: "pt-PT", title: "português (Portugal) (pt-PT)" },
    { id: "pt-CH", title: "português (Suíça) (pt-CH)" },
    { id: "pt-ST", title: "português (São Tomé e Príncipe) (pt-ST)" },
    { id: "pt-TL", title: "português (Timor-Leste) (pt-TL)" },
    { id: "pt", title: "português (pt)" },
    { id: "prg-001", title: "prūsiskan (World) (prg-001)" },
    { id: "prg", title: "prūsiskan (prg)" },
    { id: "ksf-CM", title: "rikpa (kamɛrún) (ksf-CM)" },
    { id: "ksf", title: "rikpa (ksf)" },
    { id: "ro-MD", title: "română (Republica Moldova) (ro-MD)" },
    { id: "ro-RO", title: "română (România) (ro-RO)" },
    { id: "ro", title: "română (ro)" },
    { id: "rm-CH", title: "rumantsch (Svizra) (rm-CH)" },
    { id: "rm", title: "rumantsch (rm)" },
    { id: "seh-MZ", title: "sena (Moçambique) (seh-MZ)" },
    { id: "seh", title: "sena (seh)" },
    { id: "sq-XK", title: "shqip (Kosovë) (sq-XK)" },
    { id: "sq-MK", title: "shqip (Maqedoni) (sq-MK)" },
    { id: "sq-AL", title: "shqip (Shqipëri) (sq-AL)" },
    { id: "sq", title: "shqip (sq)" },
    { id: "sk-SK", title: "slovenčina (Slovensko) (sk-SK)" },
    { id: "sk", title: "slovenčina (sk)" },
    { id: "sl-SI", title: "slovenščina (Slovenija) (sl-SI)" },
    { id: "sl", title: "slovenščina (sl)" },
    { id: "sr-ME", title: "srpski (Crna Gora) (sr-ME)" },
    { id: "sr-Latn", title: "srpski (latinica) (sr-Latn)" },
    { id: "sr-Latn-BA", title: "srpski (latinica, Bosna i Hercegovina) (sr-Latn-BA)" },
    { id: "sr-Latn-ME", title: "srpski (latinica, Crna Gora) (sr-Latn-ME)" },
    { id: "sr-Latn-XK", title: "srpski (latinica, Kosovo) (sr-Latn-XK)" },
    { id: "sr-Latn-RS", title: "srpski (latinica, Srbija) (sr-Latn-RS)" },
    { id: "fi-FI", title: "suomi (Suomi) (fi-FI)" },
    { id: "fi", title: "suomi (fi)" },
    { id: "sv-FI", title: "svenska (Finland) (sv-FI)" },
    { id: "sv-SE", title: "svenska (Sverige) (sv-SE)" },
    { id: "sv", title: "svenska (sv)" },
    { id: "sv-AX", title: "svenska (Åland) (sv-AX)" },
    { id: "tk-TM", title: "türkmen dili (Türkmenistan) (tk-TM)" },
    { id: "tk", title: "türkmen dili (tk)" },
    { id: "yo-BJ", title: "Èdè Yorùbá (Orílɛ́ède Bɛ̀nɛ̀) (yo-BJ)" },
    { id: "yo-NG", title: "Èdè Yorùbá (Orílẹ́ède Nàìjíríà) (yo-NG)" },
    { id: "yo", title: "Èdè Yorùbá (yo)" },
    { id: "is", title: "íslenska (is)" },
    { id: "is-IS", title: "íslenska (Ísland) (is-IS)" },
    { id: "cs", title: "čeština (cs)" },
    { id: "cs-CZ", title: "čeština (Česko) (cs-CZ)" },
    { id: "bas-CM", title: "Ɓàsàa (Kàmɛ̀rûn) (bas-CM)" },
    { id: "bas", title: "Ɓàsàa (bas)" },
    { id: "haw", title: "ʻŌlelo Hawaiʻi (haw)" },
    { id: "haw-US", title: "ʻŌlelo Hawaiʻi (ʻAmelika Hui Pū ʻIa) (haw-US)" },
    { id: "el", title: "Ελληνικά (el)" },
    { id: "el-GR", title: "Ελληνικά (Ελλάδα) (el-GR)" },
    { id: "el-CY", title: "Ελληνικά (Κύπρος) (el-CY)" },
    { id: "az-Cyrl", title: "азәрбајҹан (Кирил) (az-Cyrl)" },
    { id: "az-Cyrl-AZ", title: "азәрбајҹан (Кирил, Азәрбајҹан) (az-Cyrl-AZ)" },
    { id: "be", title: "беларуская (be)" },
    { id: "be-BY", title: "беларуская (Беларусь) (be-BY)" },
    { id: "bs-Cyrl", title: "босански (ћирилица) (bs-Cyrl)" },
    { id: "bs-Cyrl-BA", title: "босански (ћирилица, Босна и Херцеговина) (bs-Cyrl-BA)" },
    { id: "bg", title: "български (bg)" },
    { id: "bg-BG", title: "български (България) (bg-BG)" },
    { id: "os", title: "ирон (os)" },
    { id: "os-GE", title: "ирон (Гуырдзыстон) (os-GE)" },
    { id: "os-RU", title: "ирон (Уӕрӕсе) (os-RU)" },
    { id: "ky", title: "кыргызча (ky)" },
    { id: "ky-KG", title: "кыргызча (Кыргызстан) (ky-KG)" },
    { id: "mk", title: "македонски (mk)" },
    { id: "mk-MK", title: "македонски (Македонија) (mk-MK)" },
    { id: "mn", title: "монгол (mn)" },
    { id: "mn-MN", title: "монгол (Монгол) (mn-MN)" },
    { id: "ce", title: "нохчийн (ce)" },
    { id: "ce-RU", title: "нохчийн (Росси) (ce-RU)" },
    { id: "ru", title: "русский (ru)" },
    { id: "ru-BY", title: "русский (Беларусь) (ru-BY)" },
    { id: "ru-KZ", title: "русский (Казахстан) (ru-KZ)" },
    { id: "ru-KG", title: "русский (Киргизия) (ru-KG)" },
    { id: "ru-MD", title: "русский (Молдова) (ru-MD)" },
    { id: "ru-RU", title: "русский (Россия) (ru-RU)" },
    { id: "ru-UA", title: "русский (Украина) (ru-UA)" },
    { id: "sah", title: "саха тыла (sah)" },
    { id: "sah-RU", title: "саха тыла (Арассыыйа) (sah-RU)" },
    { id: "sr", title: "српски (sr)" },
    { id: "sr-BA", title: "српски (Босна и Херцеговина) (sr-BA)" },
    { id: "sr-CS", title: "српски (Србија и Црна Гора) (sr-CS)" },
    { id: "sr-RS", title: "српски (Србија) (sr-RS)" },
    { id: "sr-Cyrl", title: "српски (ћирилица) (sr-Cyrl)" },
    { id: "sr-Cyrl-BA", title: "српски (ћирилица, Босна и Херцеговина) (sr-Cyrl-BA)" },
    { id: "sr-Cyrl-XK", title: "српски (ћирилица, Косово) (sr-Cyrl-XK)" },
    { id: "sr-Cyrl-RS", title: "српски (ћирилица, Србија) (sr-Cyrl-RS)" },
    { id: "sr-Cyrl-ME", title: "српски (ћирилица, Црна Гора) (sr-Cyrl-ME)" },
    { id: "tt", title: "татар (tt)" },
    { id: "tt-RU", title: "татар (Россия) (tt-RU)" },
    { id: "tg", title: "тоҷикӣ (tg)" },
    { id: "tg-TJ", title: "тоҷикӣ (Тоҷикистон) (tg-TJ)" },
    { id: "uk", title: "українська (uk)" },
    { id: "uk-UA", title: "українська (Україна) (uk-UA)" },
    { id: "uz-Cyrl", title: "ўзбекча (Кирил) (uz-Cyrl)" },
    { id: "uz-Cyrl-UZ", title: "ўзбекча (Кирил, Ўзбекистон) (uz-Cyrl-UZ)" },
    { id: "kk", title: "қазақ тілі (kk)" },
    { id: "kk-KZ", title: "қазақ тілі (Қазақстан) (kk-KZ)" },
    { id: "hy", title: "հայերեն (hy)" },
    { id: "hy-AM", title: "հայերեն (Հայաստան) (hy-AM)" },
    { id: "he", title: "עברית (he)" },
    { id: "he-IL", title: "עברית (ישראל) (he-IL)" },
    { id: "ug", title: "ئۇيغۇرچە (ug)" },
    { id: "ug-CN", title: "ئۇيغۇرچە (جۇڭگو) (ug-CN)" },
    { id: "ur", title: "اردو (ur)" },
    { id: "ur-IN", title: "اردو (بھارت) (ur-IN)" },
    { id: "ur-PK", title: "اردو (پاکستان) (ur-PK)" },
    { id: "ar", title: "العربية (ar)" },
    { id: "ar-ER", title: "العربية (إريتريا) (ar-ER)" },
    { id: "ar-IL", title: "العربية (إسرائيل) (ar-IL)" },
    { id: "ar-PS", title: "العربية (الأراضي الفلسطينية) (ar-PS)" },
    { id: "ar-JO", title: "العربية (الأردن) (ar-JO)" },
    { id: "ar-AE", title: "العربية (الإمارات العربية المتحدة) (ar-AE)" },
    { id: "ar-BH", title: "العربية (البحرين) (ar-BH)" },
    { id: "ar-DZ", title: "العربية (الجزائر) (ar-DZ)" },
    { id: "ar-SD", title: "العربية (السودان) (ar-SD)" },
    { id: "ar-EH", title: "العربية (الصحراء الغربية) (ar-EH)" },
    { id: "ar-SO", title: "العربية (الصومال) (ar-SO)" },
    { id: "ar-001", title: "العربية (العالم) (ar-001)" },
    { id: "ar-IQ", title: "العربية (العراق) (ar-IQ)" },
    { id: "ar-KW", title: "العربية (الكويت) (ar-KW)" },
    { id: "ar-MA", title: "العربية (المغرب) (ar-MA)" },
    { id: "ar-SA", title: "العربية (المملكة العربية السعودية) (ar-SA)" },
    { id: "ar-YE", title: "العربية (اليمن) (ar-YE)" },
    { id: "ar-TD", title: "العربية (تشاد) (ar-TD)" },
    { id: "ar-TN", title: "العربية (تونس) (ar-TN)" },
    { id: "ar-KM", title: "العربية (جزر القمر) (ar-KM)" },
    { id: "ar-SS", title: "العربية (جنوب السودان) (ar-SS)" },
    { id: "ar-DJ", title: "العربية (جيبوتي) (ar-DJ)" },
    { id: "ar-SY", title: "العربية (سوريا) (ar-SY)" },
    { id: "ar-OM", title: "العربية (عُمان) (ar-OM)" },
    { id: "ar-QA", title: "العربية (قطر) (ar-QA)" },
    { id: "ar-LB", title: "العربية (لبنان) (ar-LB)" },
    { id: "ar-LY", title: "العربية (ليبيا) (ar-LY)" },
    { id: "ar-EG", title: "العربية (مصر) (ar-EG)" },
    { id: "ar-MR", title: "العربية (موريتانيا) (ar-MR)" },
    { id: "uz-Arab", title: "اوزبیک (عربی) (uz-Arab)" },
    { id: "uz-Arab-AF", title: "اوزبیک (عربی, افغانستان) (uz-Arab-AF)" },
    { id: "sd", title: "سنڌي (sd)" },
    { id: "sd-PK", title: "سنڌي (پاڪستان) (sd-PK)" },
    { id: "fa", title: "فارسی (fa)" },
    { id: "fa-AF", title: "فارسی (افغانستان) (fa-AF)" },
    { id: "fa-IR", title: "فارسی (ایران) (fa-IR)" },
    { id: "lrc-IR", title: "لۊری شومالی (Iran) (lrc-IR)" },
    { id: "lrc-IQ", title: "لۊری شومالی (Iraq) (lrc-IQ)" },
    { id: "lrc", title: "لۊری شومالی (lrc)" },
    { id: "mzn", title: "مازرونی (mzn)" },
    { id: "mzn-IR", title: "مازرونی (ایران) (mzn-IR)" },
    { id: "pa-Arab", title: "پنجابی (عربی) (pa-Arab)" },
    { id: "pa-Arab-PK", title: "پنجابی (عربی, پاکستان) (pa-Arab-PK)" },
    { id: "ps", title: "پښتو (ps)" },
    { id: "ps-AF", title: "پښتو (افغانستان) (ps-AF)" },
    { id: "ckb", title: "کوردیی ناوەندی (ckb)" },
    { id: "ckb-IR", title: "کوردیی ناوەندی (ئێران) (ckb-IR)" },
    { id: "ckb-IQ", title: "کوردیی ناوەندی (عێراق) (ckb-IQ)" },
    { id: "ks", title: "کٲشُر (ks)" },
    { id: "ks-IN", title: "کٲشُر (ہِنٛدوستان) (ks-IN)" },
    { id: "kok", title: "कोंकणी (kok)" },
    { id: "kok-IN", title: "कोंकणी (भारत) (kok-IN)" },
    { id: "ne", title: "नेपाली (ne)" },
    { id: "ne-NP", title: "नेपाली (नेपाल) (ne-NP)" },
    { id: "ne-IN", title: "नेपाली (भारत) (ne-IN)" },
    { id: "brx", title: "बड़ो (brx)" },
    { id: "brx-IN", title: "बड़ो (भारत) (brx-IN)" },
    { id: "mr", title: "मराठी (mr)" },
    { id: "mr-IN", title: "मराठी (भारत) (mr-IN)" },
    { id: "hi", title: "हिन्दी (hi)" },
    { id: "hi-IN", title: "हिन्दी (भारत) (hi-IN)" },
    { id: "as", title: "অসমীয়া (as)" },
    { id: "as-IN", title: "অসমীয়া (ভাৰত) (as-IN)" },
    { id: "bn", title: "বাংলা (bn)" },
    { id: "bn-BD", title: "বাংলা (বাংলাদেশ) (bn-BD)" },
    { id: "bn-IN", title: "বাংলা (ভারত) (bn-IN)" },
    { id: "pa", title: "ਪੰਜਾਬੀ (pa)" },
    { id: "pa-Guru", title: "ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ) (pa-Guru)" },
    { id: "pa-Guru-IN", title: "ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ, ਭਾਰਤ) (pa-Guru-IN)" },
    { id: "gu", title: "ગુજરાતી (gu)" },
    { id: "gu-IN", title: "ગુજરાતી (ભારત) (gu-IN)" },
    { id: "or", title: "ଓଡ଼ିଆ (or)" },
    { id: "or-IN", title: "ଓଡ଼ିଆ (ଭାରତ) (or-IN)" },
    { id: "ta", title: "தமிழ் (ta)" },
    { id: "ta-IN", title: "தமிழ் (இந்தியா) (ta-IN)" },
    { id: "ta-LK", title: "தமிழ் (இலங்கை) (ta-LK)" },
    { id: "ta-SG", title: "தமிழ் (சிங்கப்பூர்) (ta-SG)" },
    { id: "ta-MY", title: "தமிழ் (மலேசியா) (ta-MY)" },
    { id: "te", title: "తెలుగు (te)" },
    { id: "te-IN", title: "తెలుగు (భారతదేశం) (te-IN)" },
    { id: "kn", title: "ಕನ್ನಡ (kn)" },
    { id: "kn-IN", title: "ಕನ್ನಡ (ಭಾರತ) (kn-IN)" },
    { id: "ml", title: "മലയാളം (ml)" },
    { id: "ml-IN", title: "മലയാളം (ഇന്ത്യ) (ml-IN)" },
    { id: "si", title: "සිංහල (si)" },
    { id: "si-LK", title: "සිංහල (ශ්‍රී ලංකාව) (si-LK)" },
    { id: "th", title: "ไทย (th)" },
    { id: "th-TH-u-nu-thai-x-lvariant-TH", title: "ไทย (ประเทศไทย, TH, ตัวเลขไทย) (th-TH-u-nu-thai-x-lvariant-TH)" },
    { id: "th-TH", title: "ไทย (ไทย) (th-TH)" },
    { id: "lo", title: "ລາວ (lo)" },
    { id: "lo-LA", title: "ລາວ (ລາວ) (lo-LA)" },
    { id: "bo", title: "བོད་སྐད་ (bo)" },
    { id: "bo-IN", title: "བོད་སྐད་ (རྒྱ་གར་) (bo-IN)" },
    { id: "bo-CN", title: "བོད་སྐད་ (རྒྱ་ནག) (bo-CN)" },
    { id: "dz", title: "རྫོང་ཁ (dz)" },
    { id: "dz-BT", title: "རྫོང་ཁ (འབྲུག) (dz-BT)" },
    { id: "my", title: "မြန်မာ (my)" },
    { id: "my-MM", title: "မြန်မာ (မြန်မာ) (my-MM)" },
    { id: "ka", title: "ქართული (ka)" },
    { id: "ka-GE", title: "ქართული (საქართველო) (ka-GE)" },
    { id: "ti", title: "ትግርኛ (ti)" },
    { id: "ti-ET", title: "ትግርኛ (ኢትዮጵያ) (ti-ET)" },
    { id: "ti-ER", title: "ትግርኛ (ኤርትራ) (ti-ER)" },
    { id: "am", title: "አማርኛ (am)" },
    { id: "am-ET", title: "አማርኛ (ኢትዮጵያ) (am-ET)" },
    { id: "chr", title: "ᏣᎳᎩ (chr)" },
    { id: "chr-US", title: "ᏣᎳᎩ (ᏌᏊ ᎢᏳᎾᎵᏍᏔᏅ ᏍᎦᏚᎩ) (chr-US)" },
    { id: "km", title: "ខ្មែរ (km)" },
    { id: "km-KH", title: "ខ្មែរ (កម្ពុជា) (km-KH)" },
    { id: "zgh", title: "ⵜⴰⵎⴰⵣⵉⵖⵜ (zgh)" },
    { id: "zgh-MA", title: "ⵜⴰⵎⴰⵣⵉⵖⵜ (ⵍⵎⵖⵔⵉⴱ) (zgh-MA)" },
    { id: "shi-Tfng", title: "ⵜⴰⵛⵍⵃⵉⵜ (Tifinagh) (shi-Tfng)" },
    { id: "shi-Tfng-MA", title: "ⵜⴰⵛⵍⵃⵉⵜ (Tifinagh, ⵍⵎⵖⵔⵉⴱ) (shi-Tfng-MA)" },
    { id: "shi", title: "ⵜⴰⵛⵍⵃⵉⵜ (shi)" },
    { id: "zh", title: "中文 (zh)" },
    { id: "zh-CN", title: "中文 (中国) (zh-CN)" },
    { id: "zh-HK", title: "中文 (中國香港特別行政區) (zh-HK)" },
    { id: "zh-TW", title: "中文 (台灣) (zh-TW)" },
    { id: "zh-SG", title: "中文 (新加坡) (zh-SG)" },
    { id: "zh-Hans", title: "中文 (简体) (zh-Hans)" },
    { id: "zh-Hans-CN", title: "中文 (简体，中国) (zh-Hans-CN)" },
    { id: "zh-Hans-MO", title: "中文 (简体，中国澳门特别行政区) (zh-Hans-MO)" },
    { id: "zh-Hans-HK", title: "中文 (简体，中国香港特别行政区) (zh-Hans-HK)" },
    { id: "zh-Hans-SG", title: "中文 (简体，新加坡) (zh-Hans-SG)" },
    { id: "zh-Hant", title: "中文 (繁體) (zh-Hant)" },
    { id: "zh-Hant-MO", title: "中文 (繁體字，中國澳門特別行政區) (zh-Hant-MO)" },
    { id: "zh-Hant-HK", title: "中文 (繁體字，中國香港特別行政區) (zh-Hant-HK)" },
    { id: "zh-Hant-TW", title: "中文 (繁體，台灣) (zh-Hant-TW)" },
    { id: "ja", title: "日本語 (ja)" },
    { id: "ja-JP", title: "日本語 (日本) (ja-JP)" },
    { id: "ja-JP-u-ca-japanese-x-lvariant-JP", title: "日本語 (日本、JP、和暦) (ja-JP-u-ca-japanese-x-lvariant-JP)" },
    { id: "yue-Hans", title: "粤语 (简体) (yue-Hans)" },
    { id: "yue-Hans-CN", title: "粤语 (简体，中华人民共和国) (yue-Hans-CN)" },
    { id: "yue", title: "粵語 (yue)" },
    { id: "yue-Hant", title: "粵語 (繁體) (yue-Hant)" },
    { id: "yue-Hant-HK", title: "粵語 (繁體，中華人民共和國香港特別行政區) (yue-Hant-HK)" },
    { id: "ii", title: "ꆈꌠꉙ (ii)" },
    { id: "ii-CN", title: "ꆈꌠꉙ (ꍏꇩ) (ii-CN)" },
    { id: "vai-Vaii", title: "ꕙꔤ (Vai) (vai-Vaii)" },
    { id: "vai-Vaii-LR", title: "ꕙꔤ (Vai, ꕞꔤꔫꕩ) (vai-Vaii-LR)" },
    { id: "vai", title: "ꕙꔤ (vai)" },
    { id: "ko", title: "한국어 (ko)" },
    { id: "ko-KR", title: "한국어 (대한민국) (ko-KR)" },
    { id: "ko-KP", title: "한국어 (조선민주주의인민공화국) (ko-KP)" },
    { id: "ccp", title: "𑄌𑄋𑄴𑄟𑄳𑄦 (ccp)" },
    { id: "ccp-BD", title: "𑄌𑄋𑄴𑄟𑄳𑄦 (𑄝𑄁𑄣𑄘𑄬𑄌𑄴) (ccp-BD)" },
    { id: "ccp-IN", title: "𑄌𑄋𑄴𑄟𑄳𑄦 (𑄞𑄢𑄧𑄖𑄴) (ccp-IN)" }
]