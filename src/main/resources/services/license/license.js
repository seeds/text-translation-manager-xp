const Portal = require('/lib/xp/portal')
const IO = require('/lib/xp/io')

const MyLicense = require('/lib/modules/license')

exports.post = function(req) {
    const stream = Portal.getMultipartStream('license')
    const license = IO.readText(stream)
    const isValid = MyLicense.isValidLicense(license)

    log.info(`License: ${license}`)
    log.info(`Is valid? ${isValid}`)

    if(!isValid) {
        return {
            status: 400
        }
    }

    MyLicense.installLicense(license)

    return {
        status: 200
    }
}
