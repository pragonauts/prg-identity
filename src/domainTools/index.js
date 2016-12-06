/*
 * @author David Menger
 */
'use strict';

const WILDCARD = '*';
const SEPARATOR = '.';

/**
 * @param {string} query
 * @param {string} domain
 * @returns {boolean}
 */
function isInDomain (query, domain) {
    if (!domain) {
        return false;
    }

    if (domain === query || domain === WILDCARD) {
        return true;
    }

    const domainSplit = domain.split(SEPARATOR);
    const querySplit = (query || WILDCARD).split(SEPARATOR);

    if (querySplit.length < domainSplit.length) {
        return false;
    }

    const lastIndex = domainSplit.length - 1;

    for (let i = 0; i <= lastIndex; i++) {
        if (domainSplit[i] !== querySplit[i] && domainSplit[i] !== WILDCARD) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {string} needle
 * @param {[]} haystack
 * @returns {boolean}
 */
function matchesDomainList (needle, haystack) {
    return haystack.some(domain => isInDomain(needle, domain));
}

/**
 * @param {{group: string, domain: string}[]} groups
 * @param {null|string[]} [restrictToGroups=null]
 */
function getDomainsFromGroups (groups, restrictToGroups = null) {
    const ret = [];

    let restrict = restrictToGroups;

    if (restrict !== null && !Array.isArray(restrict)) {
        restrict = [restrictToGroups];
    }
    let domain;
    for (const group of groups) {
        domain = group.domain;

        if (!domain && restrictToGroups === null) {
            continue;
        } else if (!domain) {
            domain = WILDCARD;
        }

        if (restrict !== null && restrict.indexOf(group.group) === -1) {
            continue;
        }

        if (!matchesDomainList(domain, ret)) {
            ret.push(domain);
        }
    }

    return ret;
}

module.exports = {
    isInDomain,
    matchesDomainList,
    getDomainsFromGroups
};
