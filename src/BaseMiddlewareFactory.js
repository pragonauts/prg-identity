/*
 * @author David Menger
 */
'use strict';

const types = require('./tokens/types');

const DEFAULT_OPTIONS = {
    cookieKey: 'identSESSID',
    signed: false,
    tokenType: types.TYPE_TOKEN,
    httpOnly: true,
    path: '/',
    expiration: 2 * 30 * 24 * 3600 * 1000 // two months
};

class BaseMiddlewareFactory {

    constructor (tokenService, getUserByIdFn, authorizeService, options = {}) {

        this._tokensService = tokenService;

        this._getUserByIdFn = getUserByIdFn;

        this._authService = authorizeService;

        this._middleware = null;

        this._options = DEFAULT_OPTIONS;

        this.AUTH_HEADER_REGEX = /^(bearer\s)?([a-z0-9]+)$/i;

        Object.assign(this._options, options);
    }

    middleware () {
        if (this._middleware === null) {
            this._middleware = this._createMiddleware();
        }
        return this._middleware;
    }

    _createAllowedMethod () {
        const authService = this._authService;

        return function isAllowed (resource, domain = null) {
            return authService.isAllowed(this.groups, resource, domain);
        };
    }

    _getGroups (tokenObject) {
        const userId = tokenObject.userId;
        const groups = tokenObject.groups || null;

        if (groups || !userId) {
            return Promise.resolve({ user: null, groups });
        }

        return this._getUserByIdFn(userId)
            .then(user => user && {
                user,
                groups: (typeof user.groups === 'function' ? user.groups() : user.groups) || []
            });
    }

}

module.exports = BaseMiddlewareFactory;
