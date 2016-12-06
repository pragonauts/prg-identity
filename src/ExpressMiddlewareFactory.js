/*
 * @author David Menger
 */
'use strict';

const BaseMiddlewareFactory = require('./BaseMiddlewareFactory');

const AUTHORIZATION_HEADER = 'Authorization';
const DEFAULT_RESOLVER = { groups: [], userId: null, user: null };

function _createSetTokenMethod () {
    return function setToken () {
        throw new Error('Not implemented yet');
    };
}

class ExpressMiddlewareFactory extends BaseMiddlewareFactory {

    _createMiddleware () {
        const { cookieKey, signed, tokenType } = this._options;
        const AUTH_HEADER_REGEX = this.AUTH_HEADER_REGEX;
        const isAllowed = this._createAllowedMethod();
        const setToken = _createSetTokenMethod();
        const tokenService = this._tokensService;
        const getGroups = this._getGroups.bind(this);

        return function authMiddleware (req, res, next) {
            const authHeader = req.header(AUTHORIZATION_HEADER);
            let token = null;

            if (typeof authHeader === 'string') {
                const matches = authHeader.match(AUTH_HEADER_REGEX);
                if (matches) {
                    token = matches[2];
                }
            }

            if (cookieKey && token === null) {
                if (signed) {
                    token = req.signedCookies[cookieKey] || null;
                } else {
                    token = req.cookies[cookieKey] || null;
                }
            }

            let promise;

            if (token !== null) {
                promise = tokenService.getValidToken(token, tokenType)
                    .then((tokenObject) => {
                        if (tokenObject === null) {
                            return DEFAULT_RESOLVER;
                        }
                        return getGroups(tokenObject)
                                .then((groups) => {

                                    if (!groups) {
                                        return DEFAULT_RESOLVER;
                                    }

                                    return Object.assign(groups, {
                                        userId: tokenObject.userId || null
                                    });
                                });
                    });
            } else if (req.user) {
                let groups;

                if (typeof req.user.groups === 'function') {
                    groups = req.user.groups();
                } else {
                    groups = req.user.groups || [];
                }

                promise = Promise.resolve({
                    user: req.user,
                    userId: req.user.id || req.user._id || req.user.userId,
                    groups
                });
            } else {
                promise = Promise.resolve(DEFAULT_RESOLVER);
            }

            promise.then((identity) => {
                Object.assign(req, identity, {
                    isAllowed,
                    setToken
                });
                next();
            }).catch(next);
        };
    }

}

module.exports = ExpressMiddlewareFactory;
