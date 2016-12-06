/*
 * @author David Menger
 */
'use strict';

const bcrypt = require('bcrypt');
const errors = require('./errors');

const IDENTITY_TYPE = 'password';

function _hashPassword (password) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt((saltErr, salt) => {
            if (saltErr) {
                reject(saltErr);
            } else {
                bcrypt.hash(password, salt, (hashErr, hash) => {
                    if (hashErr) {
                        reject(hashErr);
                    } else {
                        resolve(hash);
                    }
                });
            }
        });

    });
}

class PasswordAuthenticate {

    /**
     * Creates an instance of PasswordAuthorize.
     *
     * @param {MongoDbUserStorage} userStorage
     */
    constructor (userStorage) {
        this._userStorage = userStorage;
    }

    * createAuthentication (password) {
        const hash = yield _hashPassword(password);

        return {
            type: IDENTITY_TYPE,
            hash
        };
    }

    /**
     *
     *
     * @param {Object|string} userNameOrEmail
     * @param {string} password
     * @returns {Object}
     */
    * authenticate (userNameOrEmail, password) {
        if (!userNameOrEmail || !password) {
            throw errors.create(errors.ERR_MISSING_CREDENTIALS);
        }

        let user = userNameOrEmail;

        if (typeof user !== 'object') {
            user = yield this._userStorage.getUser(userNameOrEmail);
        }

        if (user === null) {
            throw errors.create(errors.ERR_USER_NOT_FOUND);
        }

        const passwordMatch = yield this.verifyPassword(user, password);
        if (!passwordMatch) {
            throw errors.create(errors.ERR_PASSWORD_MISMATCH);
        }

        return user;
    }

    verifyPassword (user, password) {
        const authentication = user.auths
            .filter(auth => auth.type === IDENTITY_TYPE)[0];

        if (!authentication) {
            return Promise.reject(errors.create(errors.ERR_AUTHORIZATION_METHOD_UNAVAILABLE));
        }

        return new Promise((resolve, reject) => {
            bcrypt.compare(password, authentication.hash, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

}

module.exports = PasswordAuthenticate;
