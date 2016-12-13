/**
 * Created by Václav on 10.10.2016.
 */

'use strict';

class PasswordResetter {

    /**
     * @param {TokensService} tokensService
     * @param {{
     *      tokenExpiresInMinutes: number
     * }} [options]
     */
    constructor (tokensService, options = {}) {

        this._tokensService = tokensService;

        this._options = Object.assign({
            tokenExpiresInMinutes: 30
        }, options);
    }

    createToken (userId, options) {

        const expireAt = this._getExpireAt();

        return this._tokensService.createToken(
            this._tokensService.TYPE_PASSWORD_RESET,
            userId,
            Object.assign({ expireAt }, options)
        );
    }

    _getExpireAt () {

        const expireAt = new Date();
        expireAt.setMinutes(expireAt.getMinutes() + this._options.tokenExpiresInMinutes);

        return expireAt;
    }

    findAndRemoveToken (token) {
        return this._tokensService.getAndInvalidateToken(
            token,
            this._tokensService.TYPE_PASSWORD_RESET
        );
    }

}

module.exports = PasswordResetter;
