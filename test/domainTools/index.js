/*
 * @author David Menger
 */
'use strict';

const domainTools = require('../../src/domainTools');
const assert = require('assert');

describe('domainTools', function () {

    describe('#isInDomain()', function () {

        it('true when everything is in star domain', function () {
            assert(domainTools.isInDomain('any', '*'), 'Should be in domain');
        });

        it('true when domain and query exactly matches', function () {
            assert(domainTools.isInDomain('concreete', 'concreete'), 'Should be in domain');
        });

        it('true when there is subdomain wildcard matches', function () {
            assert(domainTools.isInDomain('some.subdomain', 'some.*'), 'Should be in domain');
        });

        it('true when there is subdomain wildcard matches', function () {
            assert(domainTools.isInDomain('some.subdomain', 'some.*'), 'Should be in domain');
        });

        it('true when domain is longer then requested, and there is no end wildcard', function () {
            assert(domainTools.isInDomain('some.foo.any', 'some.foo'), 'Should be in domain');
            assert(domainTools.isInDomain('some.foo.any', 'some.foo.*'), 'Should be in domain');
        });

        it('false when domain is empty', function () {
            assert(!domainTools.isInDomain(null, null), 'Should not be in domain');
            assert(!domainTools.isInDomain('any', null), 'Should not be in domain');
        });

        it('false when request is empty with specified subdomain', function () {
            assert(!domainTools.isInDomain(null, 'some.*'), 'Should not be in domain');
        });

        it('true when request is in wildcard pattern', function () {
            assert(domainTools.isInDomain(null, '*'), 'Should be in domain');
        });

    });


    describe('#getDomainsFromGroups()', function () {

        it('should extract non-empty domains from list of groups', function () {
            const groups = [
                { group: 'empty-domain' },
                { group: 'should-pass', domain: 'first' },
                { group: 'should-pass-too', domain: 'second' }
            ];

            const res = domainTools.getDomainsFromGroups(groups);

            assert.deepEqual(res, [
                'first', 'second'
            ], 'list of domains should match');
        });

        it('should extract non-empty domains from list of groups and filter it', function () {
            const groups = [
                { group: 'empty-domain' },
                { group: 'should-pass', domain: 'first' },
                { group: 'should-not-pass', domain: 'second' }
            ];

            const res = domainTools.getDomainsFromGroups(groups, 'should-pass');

            assert.deepEqual(res, [
                'first'
            ], 'list of domains should match');
        });

        it('should pass wildcard, when filtering specific domains', function () {
            const groups = [
                { group: 'should-pass' },
                { group: 'should-pass', domain: 'first' },
                { group: 'should-not-pass', domain: 'second' }
            ];

            const res = domainTools.getDomainsFromGroups(groups, 'should-pass');

            assert.deepEqual(res, [
                '*'
            ], 'list of domains should match');
        });

    });
});
