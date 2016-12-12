/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const tokenFactory = require('../../src/tokens/mongodbTokenFactory');

describe('tokenFactory()', function () {

    it('should create token with predefined token', function () {
        const grp = { group: 'grp' };
        const ret = tokenFactory('type', [grp], { token: '57e05fe00000000000000002abcd' });

        assert(ret instanceof Promise);

        return ret.then((token) => {
            assert(typeof token === 'object');

            assert.strictEqual(token.token, '57e05fe00000000000000002abcd');
            assert.strictEqual(token.id, '57e05fe00000000000000002');
            assert.strictEqual(token.type, 'type');
            assert.strictEqual(token.userId, null);
            assert.deepEqual(token.groups, [grp]);
        });
    });

    it('should reject invalid tokens', function () {
        const grp = { group: 'grp' };
        const ret = tokenFactory('type', [grp], { token: '57e05fe0000zz00000000002abcd' });

        assert(ret instanceof Promise);

        let error;

        return ret
            .catch((e) => {
                error = e;
                return true;
            })
            .then(() => {
                assert(error instanceof Error);
            });
    });

    it('should create token when node is provided', function () {
        const ret = tokenFactory('type', 456, { });

        assert(ret instanceof Promise);

        return ret.then((token) => {
            assert(typeof token === 'object');

            assert.equal(typeof token.id, 'string');
            assert.equal(typeof token.token, 'string');
            assert.ok(token.token.match(new RegExp(`^${token.id}`)));

            assert.ok(token.type, 'type');
            assert.strictEqual(token.userId, 456);
            assert.strictEqual(token.groups, null);
        });
    });

});
