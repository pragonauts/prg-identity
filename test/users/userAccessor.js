/*
 * @author David Menger
 */
'use strict';

const UserAccessor = require('../../src/users/UserAccessor');
const assert = require('assert');

const WILDCARD_DOMAIN = '*';
const OWN_WILDCARD_DOMAIN = 'my.*';
const OWN_SPECIFIC_DOMAIN = 'my.bar';

const ANY_WILDCARD_DOMAIN = 'any.*';
const ANY_SPECIFIC_DOMAIN = 'any.bar';

const SUPER_GROUP_WITHOUT_DOMAIN = { group: 'super' };
const SUPER_GROUP_WILDCARD_DOMAIN = { group: 'super', domain: WILDCARD_DOMAIN };

const GENERAL_GROUP_WITHOUT_DOMAIN = { group: 'general' };
const GENERAL_GROUP_WILDCARD_DOMAIN = { group: 'general', domain: WILDCARD_DOMAIN };
const GENERAL_GROUP_OWN_WILDCARD_DOMAIN = { group: 'general', domain: OWN_WILDCARD_DOMAIN };
const GENERAL_GROUP_OWN_SPECIFIC_DOMAIN = { group: 'general', domain: OWN_SPECIFIC_DOMAIN };

const ADMIN_GROUP_WITHOUT_DOMAIN = { group: 'admin' };
const ADMIN_GROUP_WILDCARD_DOMAIN = { group: 'admin', domain: WILDCARD_DOMAIN };
const ADMIN_GROUP_OWN_WILDCARD_DOMAIN = { group: 'admin', domain: OWN_WILDCARD_DOMAIN };
const ADMIN_GROUP_OWN_SPECIFIC_DOMAIN = { group: 'admin', domain: OWN_SPECIFIC_DOMAIN };

const GENERAL_GROUP_ANY_WILDCARD_DOMAIN = { group: 'general', domain: ANY_WILDCARD_DOMAIN };
const GENERAL_GROUP_ANY_SPECIFIC_DOMAIN = { group: 'general', domain: ANY_SPECIFIC_DOMAIN };

const ADMIN_GROUP_ANY_WILDCARD_DOMAIN = { group: 'admin', domain: ANY_WILDCARD_DOMAIN };
const ADMIN_GROUP_ANY_SPECIFIC_DOMAIN = { group: 'admin', domain: ANY_SPECIFIC_DOMAIN };

const MY_USER_ID = 'abcd';
const ANY_USER_ID = 'zxcv';

const SUPER_GROUP = 'super';
const ADMIN_GROUPS = ['admin'];

const DEFAULT_ARGS = [MY_USER_ID, SUPER_GROUP, ADMIN_GROUPS];

const TEST_GROUPS = [
    SUPER_GROUP_WITHOUT_DOMAIN, SUPER_GROUP_WILDCARD_DOMAIN,

    GENERAL_GROUP_WITHOUT_DOMAIN, GENERAL_GROUP_WILDCARD_DOMAIN,
    GENERAL_GROUP_OWN_WILDCARD_DOMAIN, GENERAL_GROUP_OWN_SPECIFIC_DOMAIN,

    ADMIN_GROUP_WITHOUT_DOMAIN, ADMIN_GROUP_WILDCARD_DOMAIN,
    ADMIN_GROUP_OWN_WILDCARD_DOMAIN, ADMIN_GROUP_OWN_SPECIFIC_DOMAIN,

    GENERAL_GROUP_ANY_WILDCARD_DOMAIN, GENERAL_GROUP_ANY_SPECIFIC_DOMAIN,

    ADMIN_GROUP_ANY_WILDCARD_DOMAIN, ADMIN_GROUP_ANY_SPECIFIC_DOMAIN
];

describe('UserAccessor', function () {

    describe('filterGroups()', function () {

        it('super-user should see everything regardless domain', function () {
            let acc = new UserAccessor([SUPER_GROUP_WILDCARD_DOMAIN], MY_USER_ID, SUPER_GROUP);
            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), TEST_GROUPS, 'should see');

            acc = new UserAccessor([SUPER_GROUP_WITHOUT_DOMAIN], MY_USER_ID, SUPER_GROUP);
            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), TEST_GROUPS, 'should see');
        });

        it('dummy-user should not see anything from foreign users', function () {
            let acc = new UserAccessor([], MY_USER_ID, SUPER_GROUP);
            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), [], 'should see');

            acc = new UserAccessor([], MY_USER_ID, SUPER_GROUP);
            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), [], 'should see');
        });

        it('user can see just own domain', function () {
            let acc = new UserAccessor([
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN
            ], MY_USER_ID, SUPER_GROUP);

            let shouldBe = [
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN,
                ADMIN_GROUP_OWN_SPECIFIC_DOMAIN
            ];

            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), shouldBe, 'should see');

            acc = new UserAccessor([
                ADMIN_GROUP_OWN_WILDCARD_DOMAIN
            ], MY_USER_ID, SUPER_GROUP);

            shouldBe = [
                GENERAL_GROUP_OWN_WILDCARD_DOMAIN,
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN,
                ADMIN_GROUP_OWN_WILDCARD_DOMAIN,
                ADMIN_GROUP_OWN_SPECIFIC_DOMAIN
            ];

            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), shouldBe, 'should see');
        });

        it('same user can see everything', function () {
            const acc = new UserAccessor([
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN
            ], MY_USER_ID, SUPER_GROUP);

            assert.deepEqual(acc.filterGroups(TEST_GROUPS, MY_USER_ID), TEST_GROUPS, 'should see');
        });

        it('admin can manage just own domain', function () {

            // CASE 1
            let acc = new UserAccessor([
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN
            ], MY_USER_ID, SUPER_GROUP, ADMIN_GROUPS);

            let shouldBe = [
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN,
                ADMIN_GROUP_OWN_SPECIFIC_DOMAIN
            ];

            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), shouldBe, 'should see');


            // CASE 2
            acc = new UserAccessor([
                ADMIN_GROUP_OWN_WILDCARD_DOMAIN
            ], MY_USER_ID, SUPER_GROUP, ADMIN_GROUPS);

            shouldBe = [
                GENERAL_GROUP_OWN_WILDCARD_DOMAIN,
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN,
                ADMIN_GROUP_OWN_WILDCARD_DOMAIN,
                ADMIN_GROUP_OWN_SPECIFIC_DOMAIN
            ];

            assert.deepEqual(acc.filterGroups(TEST_GROUPS, ANY_USER_ID), shouldBe, 'should see');
        });

        it('should accept bad params', function () {
            let acc = new UserAccessor([
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN
            ], MY_USER_ID, SUPER_GROUP, ADMIN_GROUPS);

            assert.deepEqual(acc.filterGroups(null, MY_USER_ID), [], 'should not see');
            assert.deepEqual(acc.filterGroups({}, MY_USER_ID), [], 'should not see');

            acc = new UserAccessor([
                GENERAL_GROUP_OWN_SPECIFIC_DOMAIN
            ], null, SUPER_GROUP, ADMIN_GROUPS);

            assert.deepEqual(acc.filterGroups({}, null), [], 'should not see');
        });

    });

    describe('#isAdministrable()', function () {

        it('should return true, when caller user is able to administrate tested user', function () {
            let acc = new UserAccessor([SUPER_GROUP_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([ADMIN_GROUP_WITHOUT_DOMAIN]), true);

            acc = new UserAccessor([SUPER_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([ADMIN_GROUP_WITHOUT_DOMAIN]), true);
        });

        it('superuser can administrate superusers', function () {
            let acc = new UserAccessor([SUPER_GROUP_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WITHOUT_DOMAIN]), true);

            acc = new UserAccessor([SUPER_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WILDCARD_DOMAIN]), true);
        });

        it('admin should not be able to administrate superuser', function () {

            let acc = new UserAccessor([ADMIN_GROUP_OWN_SPECIFIC_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WITHOUT_DOMAIN]), false);

            acc = new UserAccessor([ADMIN_GROUP_OWN_SPECIFIC_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WILDCARD_DOMAIN]), false);

            acc = new UserAccessor([ADMIN_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WILDCARD_DOMAIN]), false);

            acc = new UserAccessor([ADMIN_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([SUPER_GROUP_WITHOUT_DOMAIN]), false);
        });

        it('user with no groups is administrable by admin without domain', function () {
            let acc = new UserAccessor([ADMIN_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([]), true);

            acc = new UserAccessor([ADMIN_GROUP_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([]), true);

            acc = new UserAccessor([ADMIN_GROUP_ANY_SPECIFIC_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([]), false);

            acc = new UserAccessor([GENERAL_GROUP_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isAdministrable([]), false);
        });

    });

    describe('#isRelated()', function () {

        it('superuser is related with everyone', function () {
            let acc = new UserAccessor([SUPER_GROUP_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_WITHOUT_DOMAIN]), true);

            acc = new UserAccessor([SUPER_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_WITHOUT_DOMAIN]), true);
        });

        it('admin is not related with superuser', function () {
            let acc = new UserAccessor([ADMIN_GROUP_ANY_SPECIFIC_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([SUPER_GROUP_WITHOUT_DOMAIN]), false);

            acc = new UserAccessor([ADMIN_GROUP_WITHOUT_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([SUPER_GROUP_WILDCARD_DOMAIN]), false);
        });

        it('admin should be in relation only inside the domain', function () {
            const acc = new UserAccessor([ADMIN_GROUP_OWN_WILDCARD_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_OWN_SPECIFIC_DOMAIN]), true);
            assert.strictEqual(acc.isRelated([GENERAL_GROUP_OWN_WILDCARD_DOMAIN]), true);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_ANY_SPECIFIC_DOMAIN]), false);
            assert.strictEqual(acc.isRelated([GENERAL_GROUP_ANY_WILDCARD_DOMAIN]), false);
        });

        it('general user should be in relation only inside the domain', function () {
            const acc = new UserAccessor([GENERAL_GROUP_OWN_SPECIFIC_DOMAIN], ...DEFAULT_ARGS);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_OWN_SPECIFIC_DOMAIN]), true);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_OWN_SPECIFIC_DOMAIN]), true);
            assert.strictEqual(acc.isRelated([GENERAL_GROUP_OWN_WILDCARD_DOMAIN]), false);
            assert.strictEqual(acc.isRelated([ADMIN_GROUP_ANY_SPECIFIC_DOMAIN]), false);
            assert.strictEqual(acc.isRelated([GENERAL_GROUP_ANY_WILDCARD_DOMAIN]), false);
        });

    });


});
