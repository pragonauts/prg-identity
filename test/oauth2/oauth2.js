/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const Oauth2 = require('../../src/oauth2/OAuth2.js');

const SAMPLE_CLIENT_ID = 'abc';
const CREATED_TOKEN = 'createdtoken';
const MOCK_USER_TOKEN = { token: 'hehe' };

function createMockTokenService (attachToken = false) {
    const tokenService = {
        validTokenResponse: null,
        createToken (type, idOrGroups, metadata) {
            return attachToken ? Object.assign({ token: CREATED_TOKEN }, metadata) : metadata;
        },
        getValidToken () {
            return Promise.resolve(this.validTokenResponse);
        }
    };

    sinon.spy(tokenService, 'createToken');
    sinon.spy(tokenService, 'getValidToken');

    return tokenService;
}

function createMockAppProvider () {
    return new Map([
        [SAMPLE_CLIENT_ID, {
            clientId: SAMPLE_CLIENT_ID,
            clientSecret: 'x',
            redirectUri: 'http://abc.xyz',
            allowedMethods: ['token']
        }]
    ]);
}

function createMockUserTokenFactory () {
    return sinon.spy(() => Promise.resolve(MOCK_USER_TOKEN));
}

function createMockService (attachToken = false) {
    const tokenService = createMockTokenService(attachToken);
    const appProvider = createMockAppProvider();
    const userTokenFactory = createMockUserTokenFactory();
    const oauth = new Oauth2(tokenService, appProvider, userTokenFactory);

    return { oauth, userTokenFactory, appProvider, tokenService };
}

describe('OAuth2', function () {

    describe('#authorizationRequest()', function () {

        it('should validate request and create login token', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest()
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 400, 'error should have status 400');
                    done();
                });
        });

        it('should require filled request with client_id', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                redirect_uri: 'http://abc.xyz/abc',
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 400, 'error should have status 400');
                    done();
                });
        });

        it('should require filled request with redirect_uri', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 400, 'error should have status 400');
                    done();
                });
        });

        it('should require filled request with response_type', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyz/abc',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 400, 'error should have status 400');
                    done();
                });
        });

        it('should require filled request with state', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyz/abc',
                response_type: 'token',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 400, 'error should have status 400');
                    done();
                });
        });

        it('should throw an error with forbidden state when client_id is not matching', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: 'foo',
                redirect_uri: 'http://abc.xyz/abc',
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 403, 'error should have status 403');
                    done();
                });
        });

        it('should throw an error with when redirect_uri not starts with predefined pattern', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyb',
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 403, 'error should have status 403');
                    done();
                });
        });

        it('should throw an error with when response_type not matches with application', function (done) {
            const { oauth } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyb',
                response_type: 'code',
                state: 'filled',
                scope: 'some'
            })
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error, 'should return error');
                    assert.strictEqual(e.status, 403, 'error should have status 403');
                    done();
                });
        });

        it('should throw an error with forbidden state when redirect_uri is not matching', function (done) {
            const { oauth, tokenService } = createMockService();

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyz/abc',
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then((res) => {
                    assert.strictEqual(res, tokenService.createToken.firstCall.args[2], 'should return tokenservice response');
                    assert.strictEqual(tokenService.createToken.calledOnce, true, 'tokenService should be called');
                    assert.deepEqual(tokenService.createToken.firstCall.args,
                        [
                            'oauth_authentication_token', // token type
                            null, // user or groups
                            res
                        ], 'tokenService should be called');
                    done();
                })
                .catch(e => done(e));
        });

    });

    describe('#successfulAuthentication()', function () {

        it('should validate request and create login token', function (done) {
            const { oauth, tokenService, userTokenFactory } = createMockService(true);
            let token;

            oauth.authorizationRequest({
                client_id: SAMPLE_CLIENT_ID,
                redirect_uri: 'http://abc.xyz/abc',
                response_type: 'token',
                state: 'filled',
                scope: 'some'
            })
                .then((resToken) => {
                    token = resToken;
                    tokenService.validTokenResponse = token;

                    return oauth.successfulAuthentication(token.token, 12, 'domain');
                })
                .then((obj) => {
                    assert.deepEqual(obj, {
                        url: `http://abc.xyz/abc#token=${MOCK_USER_TOKEN.token}&state=filled`,
                        token: MOCK_USER_TOKEN.token
                    });
                    assert.deepEqual(userTokenFactory.firstCall.args, [12, 'domain']);
                    assert.deepEqual(tokenService.getValidToken.firstCall.args, [CREATED_TOKEN, 'oauth_authentication_token']);
                    done();
                })
                .catch(e => done(e));
        });

        it('should forbid bad requests', function (done) {
            const { oauth } = createMockService(true);

            oauth.successfulAuthentication(undefined, 12, 'domain')
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error);
                    assert.strictEqual(e.status, 410);
                    done();
                });
        });

        it('should forbid bad requests', function (done) {
            const { oauth } = createMockService(true);

            oauth.successfulAuthentication('nonexisting', 12, 'domain')
                .then(() => done('should not be called'))
                .catch((e) => {
                    assert(e instanceof Error);
                    assert.strictEqual(e.status, 410);
                    done();
                });
        });

    });

});
