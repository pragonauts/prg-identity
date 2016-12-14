/*
 * @author David Menger
 */
'use strict';

const UserFactory = require('./UserFactory');
const UserAccessor = require('./UserAccessor');

const DEFAULT_CONFIG = {
    superGroup: 'superuser',
    adminGroups: null
};

const GROUPS_FIELD = 'groups';

class UsersService {

    /**
     * @param {*} userStorage
     * @param {Object} [config]
     * @param {string} [config.superGroup]
     * @param {string[]} [config.adminGroups]
     * @param {Function} [formatter] - user formatter
     */
    constructor (userStorage, config = {}, formatter = a => a) {

        /**
         * @type {MongoDbUserStorage}
         */
        this.storage = userStorage;

        this.config = DEFAULT_CONFIG;
        Object.assign(this.config, config);

        this.formatter = formatter;
    }

    init (database) {
        return this.storage.init(database);
    }

    createAccessor (groupList = [], userId = null) {
        return new UserAccessor(
            groupList, userId,
            this.config.superGroup,
            this.config.adminGroups
        );
    }

    getUserById (userId, withAccessor = null, includeRemoved = false) {
        return this.storage.findById(userId, includeRemoved)
            .then(user => this.formatter(user, withAccessor));
    }

    getUserByAuth (type, extId) {
        return this.storage.getUserByAuth(type, extId);
    }

    createUser (data, authentication = null) {
        const factory = new UserFactory(data);

        if (authentication !== null) {
            factory.addAuthentication(authentication);
        }

        const user = factory.createUserObject();

        return this.storage.createUser(user)
            .then(res => res);
    }

    /**
     * @param {string} userId
     * @param {{ type: string, id?: *, hash?: string }} authentication
     * @param {UserAccessor} withAccessor
     * @returns {Promise}
     */
    setUserAuthentication (userId, authentication, withAccessor = null) {
        return this.storage.setUserAuthentication(userId, authentication)
            .then(user => this.formatter(user, withAccessor));
    }

    /**
     * @param {string} userId
     * @param {string} type
     * @param {UserAccessor} withAccessor
     * @returns {Promise}
     */
    removeUserAuthentication (userId, type, withAccessor = null) {
        return this.storage.removeUserAuthentication(userId, type)
            .then(user => this.formatter(user, withAccessor));
    }

    addUserGroup (userId, group, withAccessor = null) {
        return this.storage.upsertUserArrayItem(userId, GROUPS_FIELD, group)
            .then(user => this.formatter(user, withAccessor));
    }

    removeUserGroup (userId, group, withAccessor = null) {
        return this.storage.dropUserArrayItem(userId, GROUPS_FIELD, group)
            .then(user => this.formatter(user, withAccessor));
    }

    updateUserData (userId, data, withAccessor = null) {
        return this.storage.updateUser(userId, data)
            .then(user => this.formatter(user, withAccessor));
    }

}

module.exports = UsersService;
