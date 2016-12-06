/*
 * @author David Menger
 */
'use strict';

function createError (message, code) {
    return Object.assign(new Error(message), {
        status: code
    });
}

const errors = {

    ERR_USER_NOT_FOUND: 404,
    ERR_PASSWORD_MISMATCH: 401,
    ERR_AUTHORIZATION_METHOD_UNAVAILABLE: 403,
    ERR_MISSING_CREDENTIALS: 400,

    create (code) {
        switch (code) {
            case errors.ERR_PASSWORD_MISMATCH:
                return createError('Password mismatch', code);
            case errors.ERR_USER_NOT_FOUND:
                return createError('User not found', code);
            case errors.ERR_AUTHORIZATION_METHOD_UNAVAILABLE:
                return createError('Method unavailable', code);
            case errors.ERR_MISSING_CREDENTIALS:
                return createError('Missing credentials', code);
            default:
                return new Error('Unknown error');
        }
    }

};

module.exports = errors;
