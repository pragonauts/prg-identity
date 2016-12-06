/*
 * @author David Menger
 */
'use strict';

const BaseMiddlewareFactory = require('./BaseMiddlewareFactory');

class KoaMiddlewareFactory extends BaseMiddlewareFactory {

    _createSetTokenMethod () {
        const { cookieKey, httpOnly, signed, path, secure, expiration }
            = this._options;

        return function setToken (token) {
            let tokenString = token;
            if (typeof token === 'object') {
                tokenString = token.token;
            }

            let expires = null;
            if (expiration !== null && expiration > 0) {
                expires = new Date(Date.now() + expiration);
            }
            this.cookies.set(cookieKey, tokenString, {
                overwrite: true,
                httpOnly,
                signed,
                expires,
                path,
                secure
            });
        };
    }

    _createMiddleware () {
        const { cookieKey, signed, tokenType } = this._options;
        const tokenService = this._tokensService;
        const allowedMethod = this._createAllowedMethod();
        const setTokenMethod = this._createSetTokenMethod();
        const AUTH_HEADER_REGEX = this.AUTH_HEADER_REGEX;
        const getGroups = this._getGroups.bind(this);

        return function* authMiddleware (next) {
            const authHeader = this.headers.Authorization;
            let token = null;

            if (typeof authHeader === 'string') {
                const matches = authHeader.match(AUTH_HEADER_REGEX);
                if (matches) {
                    token = matches[2];
                }
            }

            if (cookieKey && token === null) {
                const cookie = this.cookies.get(cookieKey, {
                    signed
                });
                token = cookie || null;
            }

            let groupsAndUser;
            let userId = null;

            if (token !== null) {
                const tokenObject = yield tokenService.getValidToken(token, tokenType);

                if (tokenObject !== null) {
                    userId = tokenObject.userId;
                    groupsAndUser = yield getGroups(tokenObject);
                }
            }

            this.groups = groupsAndUser ? groupsAndUser.groups : [];
            this.userId = userId;
            this.user = groupsAndUser ? groupsAndUser.user : null;
            this.isAllowed = allowedMethod;
            this.setToken = setTokenMethod;

            yield next;
        };
    }

}

module.exports = KoaMiddlewareFactory;
