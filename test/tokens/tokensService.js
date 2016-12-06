/*
 * @author David Menger
 */
'use strict';

const TokensService = require('../../src/tokens/TokensService');
const sinon = require('sinon');
const assert = require('assert');

describe('TokensService', function () {

    describe('#dropToken()', function () {

        it('should extract id from token end remove it in storage', function () {
            const storage = { dropTokenById: sinon.spy(p => Promise.resolve(p)) };

            const ts = new TokensService(storage);

            const ret = ts.dropToken('57e05fe00000000000000002abcd');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((id) => {
                assert(storage.dropTokenById.calledOnce);
                assert.equal(id, '57e05fe00000000000000002');
            });
        });

        it('should return empty result, when invalid token is used', function () {
            const storage = { dropTokenById: sinon.spy(p => Promise.resolve(p)) };

            const ts = new TokensService(storage);

            const ret = ts.dropToken('57e05fe000000zz000000002abcd');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((id) => {
                assert(!storage.dropTokenById.called);
                assert.strictEqual(id, null);
            });
        });

    });


    describe('#createToken', function () {

        it('should call token factory, save token and return it', function () {
            const storage = { saveToken: sinon.spy(p => Promise.resolve(p)) };
            const token = { id: 5, token: '5' };
            const tokenFactory = sinon.spy(() => Promise.resolve(token));

            const ts = new TokensService(storage, tokenFactory);

            const args = ['type', 123, {}, 25];

            const ret = ts.createToken(...args);

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((insertedToken) => {
                assert(storage.saveToken.calledOnce);
                assert.deepEqual(storage.saveToken.firstCall.args, [5, token]);

                assert.strictEqual(token, insertedToken);

                assert(tokenFactory.calledOnce);
                assert.deepEqual(tokenFactory.firstCall.args, args);
            });
        });

    });

    describe('#init()', function () {

        it('shoud pass database to storage', function () {
            const storage = { init: sinon.spy(p => Promise.resolve(p)) };

            const ts = new TokensService(storage);
            const database = {};

            const ret = ts.init(database);

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then(() => {
                assert(storage.init.calledOnce);
                assert.deepEqual(storage.init.firstCall.args, [database]);
            });
        });

    });

    describe('#getValidToken()', function () {

        it('should return null result when invalid token is used', function () {
            const storage = { getTokenById: sinon.spy(p => Promise.resolve(p)) };

            const ts = new TokensService(storage);

            const ret = ts.getValidToken('57e05fe000000zz000000002abcd');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((result) => {
                assert(!storage.getTokenById.called);
                assert.strictEqual(result, null);
            });
        });

        it('should always return null, when storage return empty result', function () {
            const storage = { getTokenById: sinon.spy(() => Promise.resolve(false)) };

            const ts = new TokensService(storage);

            const ret = ts.getValidToken('57e05fe00000000000000002abcd');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((result) => {
                assert(storage.getTokenById.calledOnce);
                assert.strictEqual(result, null);
            });
        });

        it('should return null, when the token not match', function () {
            const token = { token: '57e05fe00000000000000002abcd-X' };
            const storage = { getTokenById: sinon.spy(() => Promise.resolve(token)) };

            const ts = new TokensService(storage);

            const ret = ts.getValidToken('57e05fe00000000000000002abcd');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((result) => {
                assert(storage.getTokenById.calledOnce);
                assert.strictEqual(result, null);
            });
        });

        it('should return null, when the token type not match', function () {
            const token = { token: '57e05fe00000000000000002abcd', type: 'foo' };
            const storage = { getTokenById: sinon.spy(() => Promise.resolve(token)) };

            const ts = new TokensService(storage);

            const ret = ts.getValidToken('57e05fe00000000000000002abcd', 'bar');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((result) => {
                assert(storage.getTokenById.calledOnce);
                assert.strictEqual(result, null);
            });
        });

        it('should return null, when the token expired', function () {

            const token = { token: '57e05fe00000000000000002abcd', type: 'foo', expireAt: new Date(Date.now() + 20) };
            const storage = { getTokenById: sinon.spy(() => Promise.resolve(token)) };

            const ts = new TokensService(storage);

            const beforeExpireResultPromise = ts.getValidToken('57e05fe00000000000000002abcd', 'foo');

            assert(beforeExpireResultPromise instanceof Promise, 'Should return Promise');

            return beforeExpireResultPromise.then((beforeExpireResult) => {
                assert(storage.getTokenById.calledOnce);
                assert.strictEqual(beforeExpireResult, token);

                return new Promise((resolve) => {
                    setTimeout(resolve, 40);
                });
            })
            .then(() => ts.getValidToken('57e05fe00000000000000002abcd', 'foo'))
            .then((afterExpireResult) => {
                assert(storage.getTokenById.calledTwice);
                assert.strictEqual(afterExpireResult, null);
            });
        });

        it('should return null, when the one-time token was already used', function () {

            const token = { token: '57e05fe00000000000000002abcd', type: 'foo' };

            let storedToken = token;
            const storage = {
                getTokenById: sinon.spy(() => Promise.resolve(storedToken)),
                dropTokenById: sinon.spy(() => Promise.resolve(storedToken = null))
            };

            const ts = new TokensService(storage);

            const firstGetPromise = ts.getAndInvalidateToken('57e05fe00000000000000002abcd', 'foo');

            assert(firstGetPromise instanceof Promise, 'Should return Promise');

            return firstGetPromise.then((firstGetResult) => {
                assert(storage.getTokenById.calledOnce);
                assert.strictEqual(firstGetResult, token);

                return ts.getAndInvalidateToken('57e05fe00000000000000002abcd', 'foo');
            })
            .then((afterExpireResult) => {
                assert(storage.dropTokenById.calledOnce);
                assert(storage.getTokenById.calledTwice);
                assert.strictEqual(afterExpireResult, null);
            });
        });

        it('should return found token from storage', function () {
            const token = { token: '57e05fe00000000000000002abcd', type: 'foo' };
            const storage = { getTokenById: sinon.spy(() => Promise.resolve(token)) };

            const ts = new TokensService(storage);

            const ret = ts.getValidToken('57e05fe00000000000000002abcd', 'foo');

            assert(ret instanceof Promise, 'Should return Promise');

            return ret.then((result) => {
                assert(storage.getTokenById.calledOnce);
                assert.deepEqual(storage.getTokenById.firstCall.args, ['57e05fe00000000000000002']);

                assert.strictEqual(result, token);
            });
        });

    });

});
