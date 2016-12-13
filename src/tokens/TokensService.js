/*
 * @author David Menger
 */
'use strict';

const types = require('./types');

const TOKEN_ID_REGEX = /^[0-9a-f]{24}/;

/**
 * @typedef {{
 *      saveToken: (id, Object): Promise.<Object>
 *      updateToken: (string, Object): Promise.<Object>
 *      getTokenById: (string): Promise.<Object>
 *      dropTokenById: (string): Promise
 * }} TokenStorage
 */

class TokensService {

    /**
     * @param {TokenStorage} tokenStorage
     * @param {Function} tokenFactory
     */
    constructor (tokenStorage, tokenFactory) {

        this.storage = tokenStorage;

        this.tokenFactory = tokenFactory;
    }

    get TYPE_TOKEN () {
        return types.TYPE_TOKEN;
    }

    get TYPE_PASSWORD_RESET () {
        return types.TYPE_PASSWORD_RESET;
    }

    init (database) {
        return this.storage.init(database);
    }

    /**
     * @param {string} type
     * @param {string|number|Group[]} [userIdOrGroups=null]
     * @param {{ expireAt?: Date }} [options={}]
     * @param {number} [length]
     * @returns {Promise}
     */
    createToken (type, userIdOrGroups = null, options = {}, length = undefined) {

        try {
            this._validateTokenOptions(options);
        } catch (err) {
            return Promise.reject(err);
        }

        return this.tokenFactory(type, userIdOrGroups, options, length)
            .then(token => this.storage.saveToken(token.id, token).then(() => token));
    }

    _validateTokenOptions (options) {

        let commonExpireTypos = [
            'expire', 'expires',
            'expireIn', 'expiresIn',
            'expiresAt'
        ];

        if (commonExpireTypos.some(typo => typeof options[typo] !== 'undefined')) {
            throw new Error('The common typo detected, use `expireAt` key for the token expiration.');
        }
    }

    /**
     * @param {string} token
     * @returns {Promise}
     */
    dropToken (token) {
        const match = token.match(TOKEN_ID_REGEX);

        if (!match) {
            return Promise.resolve(null);
        }

        return this.storage.dropTokenById(match[0]);
    }

    updateToken (token, patch) {

        try {
            this._validateTokenOptions(patch);

        } catch (err) {
            return Promise.reject(err);
        }

        const match = token.match(TOKEN_ID_REGEX);

        if (!match) {
            return Promise.resolve(null);
        }

        return this.storage.updateToken(match[0], patch);
    }

    /**
     * @param {string} token
     * @param {any} [requestedType=null]
     * @returns {Object}
     */
    getValidToken (token, requestedType = null) {
        const match = token.match(TOKEN_ID_REGEX);

        if (!match) {
            return Promise.resolve(null);
        }

        return this.storage.getTokenById(match[0])
            .then((tokenObject) => {
                if (!tokenObject) {
                    return null;
                }

                if (tokenObject.token !== token) {
                    return null;
                }

                if (requestedType !== null
                    && tokenObject.type !== requestedType) {
                    return null;
                }

                if (tokenObject.expireAt && new Date() >= tokenObject.expireAt) {
                    return null;
                }

                return tokenObject;
            });
    }

    /**
     * @param {string} token
     * @param {any} [requestedType=null]
     * @returns {Promise.<Object|null>}
     */
    getAndInvalidateToken (token, requestedType = null) {
        return this.getValidToken(token, requestedType)
            .then((tokenObj) => {

                if (!tokenObj) {
                    return null;
                }

                return this.dropToken(token).then(() => tokenObj);
            });
    }

}

module.exports = TokensService;
