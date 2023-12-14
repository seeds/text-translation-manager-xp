document.addEventListener("DOMContentLoaded", () => {
    var textTranslationValues = []
    try {
        textTranslationValues = JSON.parse(document.getElementById('text-translation-manager-values').textContent)
    } catch(err) {
        console.info('The translate values cannot be read')
    }

    document.querySelectorAll('[data-translate-manager]').forEach(function (el) {
        var attr = el.getAttribute('data-translate-manager')
        var keySelected = textTranslationValues.find(function(item) { return item.key === attr})

        if (keySelected && keySelected.value) {
            el.innerHTML = keySelected.value
        }
    })
})