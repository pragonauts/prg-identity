/**
 * Created by Václav on 10.10.2016.
 */

'use strict';

const PasswordResetter = require('../../src/resetPassword/PasswordResetter');
const TokensService = require('../../src/tokens/TokensService');
const tokenFactory = require('../../src/tokens/mongodbTokenFactory');
const sinon = require('sinon');
const assert = require('assert');


describe('PasswordResetter', function () {

    let _storage = {};
    const ts = new TokensService({
        getTokenById: sinon.spy(id => Promise.resolve(_storage[id])),
        saveToken: sinon.spy((id, token) => Promise.resolve(_storage[id] = token)),
        dropTokenById: sinon.spy(id => Promise.resolve(delete _storage[id]))
    }, tokenFactory);

    beforeEach(() => {
        _storage = {};
    });

    const userId = '57e05fe000000abcd0000002abcd';

    it('should be able to create token', function () {

        const pr = new PasswordResetter(ts, { tokenExpiresInMinutes: 1 });

        return pr.createToken(userId)
            .then((token) => {
                assert(token.expireAt instanceof Date);
            });
    });

    it('should be able to find and remove token', () => {

        const pr = new PasswordResetter(ts, { tokenExpiresInMinutes: 1 });

        return pr.createToken(userId)
            .then(token => Promise.all([token, pr.findAndRemoveToken(token.token)]))
            .then((values) => {
                assert(values[1]);
                assert.deepEqual(values[1], values[0]);
            });
    });

    it('should not be possible to get existing token multiple times', () => {

        const pr = new PasswordResetter(ts, { tokenExpiresInMinutes: 1 });

        let createdToken;

        return pr.createToken(userId)
            .then((_createdToken) => {

                createdToken = _createdToken;

                return pr.findAndRemoveToken(createdToken.token);
            })
            .then((usedToken) => {

                assert(usedToken, 'The token should not be null for the first time');

                return pr.findAndRemoveToken(createdToken.token);
            })
            .then((usedToken) => {
                assert.equal(usedToken, null, 'The token should not be usable multiple times');
            });

    });

});
