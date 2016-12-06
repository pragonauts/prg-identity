/*
 * @author David Menger
 */
'use strict';

const errors = require('./errors');

class RemoteAuthenticate {

    constructor (userStorage) {
        this._userStorage = userStorage;
    }

    * authenticate (networkType, userId) {
        if (!userId || !networkType) {
            throw errors.create(errors.ERR_MISSING_CREDENTIALS);
        }

        const user = yield this._userStorage.getUserByAuth(networkType, userId);

        if (user === null) {
            throw errors.create(errors.ERR_USER_NOT_FOUND);
        }

        return user;
    }

    createAuthentication (networkType, userId) {
        return {
            type: networkType,
            id: userId
        };
    }

}

module.exports = RemoteAuthenticate;
