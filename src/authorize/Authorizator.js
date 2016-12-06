/*
 * @author David Menger
 */
'use strict';

const DEFAULT_SUPER_GROUP = 'superuser';
const WILDCARD = '*';
const EMPTY_SET = new Set();

class Authorizator {

    /**
     * Creates an instance of Authorizator.
     *
     * @param {Map<String, Set<String>>} aclList
     * @param {string} [superGroup]
     */
    constructor (aclList, superGroup = DEFAULT_SUPER_GROUP) {
        this._acl = aclList;
        this._superGroup = superGroup;
    }

    isAllowed (groups, resource, domain = null) {
        const groupList = this._acl.get(resource) || EMPTY_SET;

        return groups.some((group) => {

            // restrict out of domain access
            if (!this._isWithinDomain(group.domain, domain)) {
                return false;
            }

            // access for superuser
            if (group.group === this._superGroup) {
                return true;
            }

            return groupList.has(group.group);
        });
    }

    _isWithinDomain (groupDomain, requestedDomain) {
        if (!groupDomain || requestedDomain === groupDomain) {
            return true;
        } else if (!requestedDomain || typeof requestedDomain !== 'string') {
            return false;
        }

        const req = requestedDomain.split('.');
        const user = groupDomain.split('.');

        if (req.length < user.length) {
            return false;
        }

        for (let i = 0; i < user.length; i++) {
            if (user[i] !== WILDCARD && user[i] !== req[i]) {
                return false;
            }
        }

        if (req.length !== user.length && user[user.length - 1] !== WILDCARD) {
            return false;
        }

        return true;
    }

}

module.exports = Authorizator;
