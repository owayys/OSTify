var express = require("express");
var request = require("request");
var crypto = require("crypto");
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
require("dotenv").config();

var client_id = process.env.CLIENT_ID; // your clientId
var client_secret = process.env.CLIENT_SECRET; // Your secret
var redirect_uri = "https://vast-dog-apron.cyclic.app/callback"; // Your redirect uri

const generateRandomString = (length) => {
    return crypto.randomBytes(60).toString("hex").slice(0, length);
};

var stateKey = "spotify_auth_state";

var app = express();

app.use(express.static(__dirname + "/public"))
    .use(cors())
    .use(cookieParser());

app.get("/login", function (req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = "user-read-private user-read-email user-read-recently-played";
    res.redirect(
        "https://accounts.spotify.com/authorize?" +
            querystring.stringify({
                response_type: "code",
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                state: state,
            })
    );
});

app.get("/callback", function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect(
            "http://localhost:5173/#" +
                querystring.stringify({
                    error: "state_mismatch",
                })
        );
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: "https://accounts.spotify.com/api/token",
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: "authorization_code",
            },
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                Authorization:
                    "Basic " +
                    new Buffer.from(client_id + ":" + client_secret).toString(
                        "base64"
                    ),
            },
            json: true,
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: "https://api.spotify.com/v1/me",
                    headers: { Authorization: "Bearer " + access_token },
                    json: true,
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect(
                    "http://localhost:5173/#" +
                        querystring.stringify({
                            access_token: access_token,
                            refresh_token: refresh_token,
                        })
                );
            } else {
                res.redirect(
                    "http://localhost:5173/#" +
                        querystring.stringify({
                            error: "invalid_token",
                        })
                );
            }
        });
    }
});

app.get("/refresh_token", function (req, res) {
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " +
                new Buffer.from(client_id + ":" + client_secret).toString(
                    "base64"
                ),
        },
        form: {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        },
        json: true,
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token,
                refresh_token = body.refresh_token;
            res.send({
                access_token: access_token,
                refresh_token: refresh_token,
            });
        }
    });
});

app.get("/", function (req, res) {
    res.send("OSTify backend");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
