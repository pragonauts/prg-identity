/*
 * @author David Menger
 */
'use strict';


const AUTHENTICATION_TOKEN = 'oauth_authentication_token';
const DEFAULT_TOKEN_EXPIRATION = 1200 * 1000; // 20 minutes

/**
 * @param {{
 *      client_id: string
 *      redirect_uri: string
 *      response_type: string
 *      state: string
 *      scope: string
 * }} request
 * @returns {Promise}
 */
function validateRequest (request) {
    let err = null;

    if (typeof request !== 'object') {
        err = new Error('Request should be object');
    } else if (!request.client_id) {
        err = new Error('missing `client_id`');
    } else if (typeof request.redirect_uri !== 'string') {
        err = new Error('missing `redirect_uri`');
    } else if (!request.state) {
        err = new Error('missing `state`');
    } else if (typeof request.response_type !== 'string') {
        err = new Error('Bad `response_type`');
    }

    if (err) {
        err.status = 400;
        return Promise.reject(err);
    }

    return Promise.resolve();
}

function createExpiredTokenError () {
    const err = new Error('Authentication token is invalid');
    err.status = 410;
    return err;
}

function createForbiddenError (message) {
    const err = new Error(message);
    err.status = 403;
    return err;
}

class OAuth2 {

    /**
     * Creates an instance of Oauth2.
     *
     * @param {{ createToken: function, getValidToken: function }} tokenService
     * @param {Map.<string, {
     *      clientId: string
     *      clientSecret?: string
     *      redirectUri?: string
     *      allowedMethods?: array
     * }>} appsProvider - can return promise
     * @param {function()} userTokenFactory - method which creates user token
     * @param {number} [tokenExpiration] - authentication token expiration
     * @param {string} [tokenType] - authentication token type
     */
    constructor (
            tokenService,
            appsProvider,
            userTokenFactory,
            tokenExpiration = DEFAULT_TOKEN_EXPIRATION,
            tokenType = AUTHENTICATION_TOKEN
        ) {
        this.tokenService = tokenService;
        this.appsProvider = appsProvider;
        this.tokenExpiration = tokenExpiration;
        this.tokenType = tokenType;
        this.userTokenFactory = userTokenFactory;
    }

    /**
     * Validates authentication request and creates code for auth form
     * response_type = token for 2-legged OAUTH (single page apps)
     * response_type = code for 3-legged OAUTH (serverside apps)
     *
     * @param {{
     *      client_id: string
     *      redirect_uri: string
     *      response_type: string
     *      state: string
     *      scope: string
     * }} request
     * @returns {Promise.<{ token: string },Error>}
     */
    authorizationRequest (request) {

        return validateRequest(request)
            .then(() => this.appsProvider.get(request.client_id))
            .then((app) => {
                // validate application
                if (!app) {
                    throw createForbiddenError('Application is not allowed');
                }

                if (request.redirect_uri.indexOf(app.redirectUri) !== 0) {
                    throw createForbiddenError('Redirect URI does not match');
                }

                let { allowedMethods } = app;

                if (!Array.isArray(allowedMethods)) {
                    allowedMethods = allowedMethods.split(',')
                        .map(method => method.trim());
                }

                if (allowedMethods.indexOf(request.response_type) === -1) {
                    throw createForbiddenError('Bad `response_type`');
                }

                // scopes not implemented

                return app;
            }).then((app) => {
                // create the token

                const token = {
                    app,
                    clientId: request.client_id,
                    responseType: request.response_type,
                    redirectUri: request.redirect_uri,
                    state: request.state,
                    scope: request.scope,
                    expires: new Date(Date.now() + this.tokenExpiration)
                };

                return this.tokenService.createToken(this.tokenType, null, token);
            });
    }

    /**
     * @param {string} authToken - token from signup
     * @returns {*}
     */
    getValidToken (authToken) {

        if (!authToken) {
            return Promise.reject(createExpiredTokenError());
        }

        return this.tokenService.getValidToken(authToken, this.tokenType)
            .then((token) => {
                if (!token) {
                    throw createExpiredTokenError();
                }

                return token;
            });
    }

    /**
     * After successful authentication, the oauth code is created
     *
     * @param {string} authToken - token from signup
     * @param {string} userId - user identifier
     * @param {string} [domain=null]
     * @returns {Promise.<{
     *      url: string
      *     token: string
     * }, Error>} returns url to redirect
     */
    successfulAuthentication (authToken, userId, domain = null) {

        let redirectUri;
        let state;

        return this.getValidToken(authToken)
            .then((token) => {

                redirectUri = token.redirectUri;
                state = token.state;

                return this.userTokenFactory(userId, domain);
            })
            // just for response type == token
            .then(token => ({
                url: `${redirectUri}#token=${token.token}&state=${encodeURIComponent(state)}`,
                token: token.token
            }));
    }

    /**
     * Not implemented
     *
     */
    // exchangeCodeForToken () {}

}

OAuth2.AUTHENTICATION_TOKEN = AUTHENTICATION_TOKEN;

module.exports = OAuth2;
