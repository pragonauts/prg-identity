/*
 * @author David Menger
 */
'use strict';

const domainTools = require('../domainTools');

/**
 *  @typedef {Object} Group
 *  @property {string} group
 *  @property {string} [domain=undefined]
 */

class UserAccessor {

    /**
     * @param {Group[]} userGroups
     * @param {string} [byUserId=null]
     * @param {string} [superGroup=null]
     * @param {string[]} [adminGroups=null]
     */
    constructor (userGroups, byUserId = null, superGroup = null, adminGroups = null) {
        this.superGroup = superGroup;
        this.adminGroups = adminGroups;

        this.setUser(userGroups, byUserId);
    }

    /**
     * @param {Group[]} [userGroups=null]
     * @param {string} [byUserId=null]
     */
    setUser (userGroups = null, byUserId = null) {

        this.byUserId = byUserId;

        this.userDomains = domainTools.getDomainsFromGroups(userGroups);
        this.adminDomains = domainTools.getDomainsFromGroups(userGroups, this.adminGroups);

        this.isSuperUser = this._containsSuperGroup(userGroups);
    }

    /**
     * @param {string} [userId]
     * @returns {boolean}
     */
    isMe (userId) {
        return userId === this.byUserId && this.byUserId;
    }

    /**
     * @param {Group[]} groups
     * @returns {boolean}
     */
    isRelated (groups) {
        if (this.isSuperUser) {
            return true;
        }
        return this.filterGroups(groups).length !== 0;
    }

    /**
     * @param {Group[]} groups
     * @returns {boolean}
     */
    isAdministrable (groups) {
        if (this.isSuperUser) {
            return true;
        }
        if (this._containsSuperGroup(groups)) {
            return false;
        }
        if (groups.length === 0) {
            return this.filterGroups([{ group: 'any' }], null, true).length === 1;
        }
        return this.filterGroups(groups, null, true).length !== 0;
    }

    /**
     *
     * @param {Group[]} groupList
     * @param {string} personId
     * @param {boolean} [justManageable=false]
     * @returns {Group[]}
     */
    filterGroups (groupList, personId, justManageable = false) {

        let groups = groupList;

        if (!groupList || !Array.isArray(groupList)) {
            groups = [];
        }

        if (!justManageable && this.isMe(personId)) {
            return groups;
        }

        if (this.isSuperUser) {
            return groups;
        }

        const domains = justManageable ? this.adminDomains : this.userDomains;

        return groups.filter((group) => {

            // hide superuser groups to non-superuser
            if (this.superGroup !== null && this.superGroup === group.group) {
                return false;
            }

            return domainTools.matchesDomainList(group.domain, domains);
        });
    }

    _containsSuperGroup (groups) {
        return this.superGroup && groups.some(group => group.group === this.superGroup);
    }
}

module.exports = UserAccessor;
