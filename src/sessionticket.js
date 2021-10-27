const https = require("https");

function getSessionTicket(Email, Password) {
    return new Promise(function(resolve, reject) {
        var headers = { "Content-Type": "application/json", "Host": "null.playfabapi.com" }

        var req = https.request({
            method: "POST",
            host: "null.playfabapi.com",
            path: "/Client/LoginWithEmailAddress",
            search: "?sdk=JavaScriptSDK-1.93.210927",
            headers
        }, function(res) {
            var body = "";

            res.on("data", (chunk) => body += chunk);
            res.on("error", reject);
            res.on("end", function() {
                var status = res.statusCode;
                if(status == 200) resolve(JSON.parse(body).data.SessionTicket)
                else reject(new Error("Server responded with " + status + " " + res.statusMessage));
            })
        })

        req.on("error", reject);
        req.end(JSON.stringify({ TitleId: "5417", Email, Password }));
    })
}

module.exports = getSessionTicket