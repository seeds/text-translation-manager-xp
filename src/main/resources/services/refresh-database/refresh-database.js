const Translate = require('/lib/modules/translate')

exports.put = function(req) {
    Translate.initializeDatabase()
    return {
        contentType: 'application/json',
        body: {
            message: 'The database was updated successfully' // TODO: Put in i18n
        }
    }
}
