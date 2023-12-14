const HttpClient = require('/lib/http-client')

module.exports = {
    performRequest
}

function performRequest(request, MAX_RETRY = 3) {
    try {
        if (MAX_RETRY === 0) {
            return null;
        }

        return HttpClient.request(request);
    } catch (error) {
        return performRequest(request, MAX_RETRY - 1);
    }
}
