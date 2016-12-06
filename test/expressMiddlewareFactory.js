/*
 * @author David Menger
 */
'use strict';

const sinon = require('sinon');
const assert = require('assert');
const ExpressMiddlewareFactory = require('../src/ExpressMiddlewareFactory');

const USER_ID = 1;
const GRP = 'fine';
const DOMAIN = 'dom';
const GROUPS_LIKE = [{ group: GRP, domain: DOMAIN }];
const TOKEN_LIKE = { userId: USER_ID, groups: null };
const TOKEN_WITH_GROUPS = { groups: GROUPS_LIKE };
const USER_LIKE = { userId: USER_ID, groups: GROUPS_LIKE };
const USER_WITH_JUST_ID = { id: USER_ID, groups: GROUPS_LIKE };
const USER_WITH_MONGO_ID = { _id: USER_ID, groups: GROUPS_LIKE };
const USER_WITH_GRPS_METHOD = { userId: USER_ID, groups: () => GROUPS_LIKE };
const DEFAULT_COOKIE_NAME = 'cookie';

const RESOURCE = 'res';

const USER_TYPES = [
    USER_LIKE,
    USER_WITH_GRPS_METHOD,
    USER_WITH_JUST_ID,
    USER_WITH_MONGO_ID
];

const BAD_TOKEN = 'bad';
const GROUPS_TOKEN = 'grps';

function executeBaseTest (before, after, userNum = 0, resultAsJustGroups = null) {
    const tokenService = {
        getValidToken: (value) => {
            switch (value) {
                case BAD_TOKEN:
                    return Promise.resolve(null);
                case GROUPS_TOKEN:
                    return Promise.resolve(TOKEN_WITH_GROUPS);
                default:
                    return Promise.resolve(TOKEN_LIKE);
            }
        }
    };

    const authorizeService = {
        isAllowed: sinon.spy(groups => groups.length !== 0)
    };

    const getUserByIdFn = sinon.spy(
        () => Promise.resolve(USER_TYPES[userNum]));

    const { req, res, options } = before();

    const factory = new ExpressMiddlewareFactory(
        tokenService,
        getUserByIdFn,
        authorizeService,
        Object.assign({
            cookieKey: DEFAULT_COOKIE_NAME
        }, options || {})
    );

    const middleware = factory.middleware();

    assert(typeof middleware === 'function', 'Should be function');
    assert(middleware === factory.middleware(), 'Is always the same');

    middleware(req, res, (err) => {
        if (err) {
            after(err);
        }

        if (resultAsJustGroups !== null) {
            assert.strictEqual(req.user, null);
            assert.strictEqual(req.userId, null);
            assert.deepEqual(req.groups, resultAsJustGroups);
        } else {
            assert.strictEqual(req.user, USER_TYPES[userNum]);
            assert.strictEqual(req.userId, USER_ID);
            assert.strictEqual(req.groups, GROUPS_LIKE);
        }

        assert(typeof req.isAllowed === 'function');
        assert(typeof req.setToken === 'function');

        const allowedRes = req.isAllowed(RESOURCE, DOMAIN);

        assert(authorizeService.isAllowed.calledOnce,
            'should be called after isAllowed()');

        if (resultAsJustGroups !== null) {
            assert.deepEqual(authorizeService.isAllowed.firstCall.args,
                [resultAsJustGroups, RESOURCE, DOMAIN]);
            const allowed = resultAsJustGroups.length > 0;
            assert.strictEqual(allowedRes, allowed, 'Should be allowed depending on groups');
        } else {
            assert.deepEqual(authorizeService.isAllowed.firstCall.args,
                [GROUPS_LIKE, RESOURCE, DOMAIN]);
            assert.strictEqual(allowedRes, true, 'Should be allowed depending on groups');
        }

        assert.throws(() => req.setToken(), Error, 'Is not implemented YET');

        after(null, req, res, tokenService, authorizeService, getUserByIdFn);
    });
}

describe('ExpressMiddlewareFactory', function () {

    it('should create middleware', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => 'A'
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        });
    });

    it('should just pass, when theres just bad indicies of auth methods', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => BAD_TOKEN,
                signedCookies: { [DEFAULT_COOKIE_NAME]: BAD_TOKEN }
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        }, 0, []);
    });

    it('should just pass, when theres no sign of good authorization method', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                cookies: { [DEFAULT_COOKIE_NAME]: null }
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        }, 0, []);
    });

    it('should just work with just groups token', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => GROUPS_TOKEN,
                cookies: { [DEFAULT_COOKIE_NAME]: BAD_TOKEN }
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        }, 0, GROUPS_LIKE);
    });

    it('should accept user with groups method', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => 'A'
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        }, 1);
    });

    it('should load user from cookies', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                cookies: { [DEFAULT_COOKIE_NAME]: 'A' }
            };

            const res = {};

            return { req, res };
        }, (err) => {
            done(err);
        });
    });

    it('should load user from unsigned cookies', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                signedCookies: { [DEFAULT_COOKIE_NAME]: 'A' }
            };

            const res = {};

            const options = {
                signed: true
            };

            return { req, res, options };
        }, (err) => {
            done(err);
        });
    });

    it('should load user request', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                user: USER_LIKE
            };

            const res = {};

            const options = {
                cookieKey: null
            };

            return { req, res, options };
        }, (err, req, res, tokenService, authorizeService, getUserByIdFn) => {
            assert(getUserByIdFn.called === false, 'Should not be called, when user is here');
            done(err);
        });
    });

    it('should work with user with groups method', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                user: USER_WITH_GRPS_METHOD
            };

            const res = {};

            const options = {
                cookieKey: null
            };

            return { req, res, options };
        }, (err, req, res, tokenService, authorizeService, getUserByIdFn) => {
            assert(getUserByIdFn.called === false, 'Should not be called, when user is here');
            done();
        }, 1);
    });

    it('should work with user of with id', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => null,
                user: USER_TYPES[2]
            };

            const res = {};

            const options = {
                cookieKey: null
            };

            return { req, res, options };
        }, (err, req, res, tokenService, authorizeService, getUserByIdFn) => {
            assert(getUserByIdFn.called === false, 'Should not be called, when user is here');
            done(err);
        }, 2);
    });

    it('should work with user of with _id and shoud skip bad auth header', function (done) {
        executeBaseTest(() => {
            const req = {
                header: () => '-',
                user: USER_TYPES[3]
            };

            const res = {};

            const options = {
                cookieKey: null
            };

            return { req, res, options };
        }, (err, req, res, tokenService, authorizeService, getUserByIdFn) => {
            assert(getUserByIdFn.called === false, 'Should not be called, when user is here');
            done(err);
        }, 3);
    });

    it('should pass error from token service to next handler', function (done) {
        const errToPass = new Error('Should be passed to next');
        const tokenService = {
            getValidToken: () => Promise.reject(errToPass)
        };

        const getUserByIdFn = sinon.spy(
            () => Promise.resolve(USER_TYPES[0]));

        const authorizeService = {};

        const factory = new ExpressMiddlewareFactory(
            tokenService,
            getUserByIdFn,
            authorizeService,
            Object.assign({
                cookieKey: DEFAULT_COOKIE_NAME
            }, {})
        );

        const middleware = factory.middleware();

        const req = {
            header: () => BAD_TOKEN,
            signedCookies: { [DEFAULT_COOKIE_NAME]: BAD_TOKEN }
        };

        middleware(req, {}, (err) => {
            assert.strictEqual(err, errToPass);
            done();
        });
    });

    it('should pass error from user service to next handler', function (done) {
        const errToPass = new Error('Should be passed to next');

        const tokenService = {
            getValidToken: value => Promise.resolve(value === BAD_TOKEN ? null : TOKEN_LIKE)
        };

        const getUserByIdFn = sinon.spy(() => Promise.reject(errToPass));

        const authorizeService = {};

        const factory = new ExpressMiddlewareFactory(
            tokenService,
            getUserByIdFn,
            authorizeService
        );

        const middleware = factory.middleware();

        const req = {
            header: () => 'A',
            signedCookies: { identSESSID: BAD_TOKEN }
        };

        middleware(req, {}, (err) => {
            assert.strictEqual(err, errToPass);
            done();
        });
    });

    it('should work with user without groups in token', function (done) {

        const tokenService = {
            getValidToken: value => Promise.resolve(value === BAD_TOKEN ? null : TOKEN_LIKE)
        };

        const getUserByIdFn = sinon.spy(
            () => Promise.resolve({ id: USER_ID }));

        const authorizeService = {};

        const factory = new ExpressMiddlewareFactory(
            tokenService,
            getUserByIdFn,
            authorizeService,
            Object.assign({
                cookieKey: DEFAULT_COOKIE_NAME
            }, {})
        );

        const middleware = factory.middleware();

        const req = {
            header: () => 'A'
        };

        middleware(req, {}, (err) => {
            assert.deepEqual(req.groups, []);
            done(err);
        });
    });

    it('should work with user without groups in request', function (done) {

        const tokenService = {
            getValidToken: value => Promise.resolve(value === BAD_TOKEN ? null : TOKEN_LIKE)
        };

        const getUserByIdFn = sinon.spy(
            () => Promise.resolve());

        const authorizeService = {};

        const factory = new ExpressMiddlewareFactory(
            tokenService,
            getUserByIdFn,
            authorizeService,
            Object.assign({
                cookieKey: null
            }, {})
        );

        const middleware = factory.middleware();

        const req = {
            header: () => null,
            user: { id: USER_ID }
        };

        middleware(req, {}, (err) => {
            assert.deepEqual(req.groups, []);
            done(err);
        });
    });

});
