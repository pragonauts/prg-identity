/*
 * @author David Menger
 */
'use strict';

const assert = require('assert');
const { Authorizator } = require('../../index');

const SUPER_GROUPS = [{ group: 'super' }];
const SUPER_IN_DOMAIN = [{ group: 'super', domain: 'foo' }];
const KNOWN_GROUP = [{ group: 'knownGroup' }];
const KNOWN_GROUP_IN_DOMAIN = [{ group: 'knownGroup', domain: 'foo' }];
const UNKNOWN_GROUP = [{ group: 'unknownGroup' }];
const UNKNOWN_GROUP_IN_DOMAIN = [{ group: 'unknownGroup', domain: 'foo' }];

const SAMPLE_ACL_MAP = new Map([['knownResource', new Set(['knownGroup'])]]);

describe('Authorizator', function () {

    describe('#isAllowed()', function () {

        it('should return true for superuser, when is in domain', function () {
            const auth = new Authorizator(SAMPLE_ACL_MAP, 'super');

            assert.strictEqual(auth.isAllowed(SUPER_GROUPS, 'knownResource'), true);
            assert.strictEqual(auth.isAllowed(SUPER_GROUPS, 'knownResource', 'foo'), true);
            assert.strictEqual(auth.isAllowed(SUPER_IN_DOMAIN, 'knownResource', 'foo'), true);
        });

        it('should return false for superuser, when is not in domain', function () {
            const auth = new Authorizator(SAMPLE_ACL_MAP, 'super');

            assert.strictEqual(auth.isAllowed(SUPER_IN_DOMAIN, 'knownResource', 'bar'), false);
        });

        it('should return false when resource is not in ACL map', function () {
            const auth = new Authorizator(SAMPLE_ACL_MAP, 'super');

            assert.strictEqual(auth.isAllowed(KNOWN_GROUP, 'unknownResource', 'bar'), false);
            assert.strictEqual(auth.isAllowed(KNOWN_GROUP_IN_DOMAIN, 'unknownR', 'bar'), false);
            assert.strictEqual(auth.isAllowed(KNOWN_GROUP, 'unknownResource'), false);
            assert.strictEqual(auth.isAllowed(KNOWN_GROUP_IN_DOMAIN, 'unknownResource'), false);
        });

        it('should return false when resource has no matching group', function () {
            const auth = new Authorizator(SAMPLE_ACL_MAP, 'super');

            assert.strictEqual(auth.isAllowed(UNKNOWN_GROUP, 'knownResource', 'bar'), false);
            assert.strictEqual(
                auth.isAllowed(UNKNOWN_GROUP_IN_DOMAIN, 'knownResource', 'bar')
            , false);
            assert.strictEqual(auth.isAllowed(UNKNOWN_GROUP, 'knownResource'), false);
            assert.strictEqual(auth.isAllowed(UNKNOWN_GROUP_IN_DOMAIN, 'knownResource'), false);
        });

        it('should return true when there is matching rule', function () {
            const auth = new Authorizator(SAMPLE_ACL_MAP, 'super');

            assert.strictEqual(
                auth.isAllowed(KNOWN_GROUP, 'knownResource', 'foo'), true);
            assert.strictEqual(
                auth.isAllowed(KNOWN_GROUP_IN_DOMAIN, 'knownResource', 'foo'), true);
        });

    });

    describe('#_isWithinDomain()', function () {

        it('should return true when domain is same', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('same', 'same'), true);

            assert.strictEqual(auth._isWithinDomain('same.foo', 'same.foo'), true);
            assert.strictEqual(auth._isWithinDomain('same.foo.bar', 'same.foo.bar'), true);
        });

        it('should return false when domain is not the same', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('same', 'notsame'), false);

            assert.strictEqual(auth._isWithinDomain('same.foo', 'same.bar'), false);
            assert.strictEqual(auth._isWithinDomain('same.foo', 'notsame.foo'), false);
            assert.strictEqual(auth._isWithinDomain('same.foo.bar', 'same.foo.bar.x'), false);
        });

        it('should always return true when domain is empty', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain(null, 'same'), true);
            assert.strictEqual(auth._isWithinDomain(undefined, 'notsame'), true);
            assert.strictEqual(auth._isWithinDomain('', 'same.foo'), true);
        });

        it('should always return false when requested domain is not string', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('foo', null), false);
            assert.strictEqual(auth._isWithinDomain('foo', []), false);
            assert.strictEqual(auth._isWithinDomain('foo', false), false);
            assert.strictEqual(auth._isWithinDomain('foo', undefined), false);
        });

        it('should return false when domain not matches wildcard', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('same.*', 'foo.bar'), false);
            assert.strictEqual(auth._isWithinDomain('same.foo.*', 'same.bar'), false);
            assert.strictEqual(auth._isWithinDomain('same.*.foo', 'notsame.foo.bar'), false);
        });

        it('should return false when requested domain is shorter then users', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('same.*', 'same'), false);
            assert.strictEqual(auth._isWithinDomain('same.*.*', 'same.bar'), false);
            assert.strictEqual(auth._isWithinDomain('same.*.foo', 'notsame.foo'), false);

            assert.strictEqual(auth._isWithinDomain('*.foo', 'bar.foo.some'), false);
        });

        it('should return true when good wildcard is used', function () {
            const auth = new Authorizator({}, 'super');

            assert.strictEqual(auth._isWithinDomain('*', 'same'), true);
            assert.strictEqual(auth._isWithinDomain('*', 'same.foo'), true);

            assert.strictEqual(auth._isWithinDomain('same.*', 'same.bar'), true);
            assert.strictEqual(auth._isWithinDomain('same.*', 'same.bar.foo'), true);
            assert.strictEqual(auth._isWithinDomain('same.*.foo', 'same.bar.foo'), true);
            assert.strictEqual(auth._isWithinDomain('same.*.*', 'same.bar.foo'), true);
            assert.strictEqual(auth._isWithinDomain('same.*.*', 'same.bar.foo.x'), true);
        });

    });

});
