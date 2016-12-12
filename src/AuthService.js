
/*
 * @author David Menger
 */
'use strict';

const TokensService = require('./tokens/TokensService');
// const KoaMiddlewareFactory = require('./KoaMiddlewareFactory');
const Authorizator = require('./authorize/Authorizator');
const aclResolver = require('./authorize/aclResolver');
const ExpressMiddlewareFactory = require('./ExpressMiddlewareFactory');
const PasswordResetter = require('./resetPassword/PasswordResetter');
const OAuth2 = require('./oauth2/OAuth2');
const UserAccessor = require('./users/UserAccessor');

class AuthService {

    /**
     * Creates an instance of AuthService
     *
     * @param {Function} getUserByIdFn
     * @param {TokenStorage} [tokenStorage]
     * @param {Function} [tokenFactory]
     * @param {Object} [options={}]
     * @param {Object} options.acl
     * @param {Object} options.groups
     * @param {Object} [options.passwordReset]
     * @param {number} [options.passwordReset.tokenExpiresInMinutes]
     * @param {string} options.superGroup
     * @param {string[]} options.adminGroups
     * @param {string} [options.cookieKey]
     * @param {boolean} [options.signed]
     * @param {string} [options.tokenType]
     * @param {Map.<string, Object|Promise.<Object>>} [appsProvider=new Map()]
     */
    constructor (
            getUserByIdFn,
            tokenStorage,
            tokenFactory,
            options = {},
            appsProvider = new Map()) {

        this._options = options;

        this.tokensService = new TokensService(tokenStorage, tokenFactory);

        this.getUserByIdFn = getUserByIdFn;

        let aclMap = new Map();
        if (typeof this._options.acl === 'object') {
            let groups = null;

            if (typeof this._options.groups === 'object') {
                groups = this._options.groups;
            }

            aclMap = aclResolver(this._options.acl, groups);
        }

        this.authorizator = new Authorizator(aclMap);

        this._passwordResetter = new PasswordResetter(this.tokensService, options.passwordReset);

        this._koaMiddlewareFactory = null;

        this._expressMiddlewareFactory = null;

        this.oauth2 = new OAuth2(
            this.tokensService,
            appsProvider,
            (userId, domain) => this.createUserToken(userId, domain),
            options.authTokenExpiration);
    }

    init (databaseConnection) {
        return this.tokensService.init(databaseConnection);
    }

    /* koaMiddleware () {
        if (this._koaMiddlewareFactory === null) {
            this._koaMiddlewareFactory = new KoaMiddlewareFactory(
                this.tokensService,
                this.getUserByIdFn,
                this.authorizator,
                this._options
            );
        }
        return this._koaMiddlewareFactory.middleware();
    }*/

    /**
     * @returns {Function}
     */
    expressMiddleware () {
        if (this._expressMiddlewareFactory === null) {
            this._expressMiddlewareFactory = new ExpressMiddlewareFactory(
                this.tokensService,
                this.getUserByIdFn,
                this.authorizator,
                this._options
            );
        }
        return this._expressMiddlewareFactory.middleware();
    }

    /**
     * @param {string} userId
     * @param {string} [domain=null]
     * @returns {Promise.<Object>}
     */
    createUserToken (userId, domain = null) {
        const options = {};

        if (domain !== null) {
            options.domain = domain;
        }

        return this.createToken(this.tokensService.TYPE_TOKEN, userId, options);
    }

    /**
     * @param {string} userId
     * @returns {Promise}
     */
    createPasswordResetToken (userId) {
        return this._passwordResetter.createToken(userId);
    }

    /**
     * @param {string} token
     * @returns {Promise.<Object|null>}
     */
    getAndRemovePasswordResetToken (token) {
        return this._passwordResetter.findAndRemoveToken(token);
    }

    /**
     * @param {string} type
     * @param {string} [userIdOrGroups=null]
     * @param {Object} [options]
     * @param {number} [length]
     * @returns {Promise}
     */
    createToken (type, userIdOrGroups = null, options = {}, length = undefined) {
        return this.tokensService.createToken(type, userIdOrGroups, options, length);
    }

    /**
     * @param {string} type
     * @param {string} token
     * @returns {Promise.<Object|null>}
     */
    getToken (type, token) {
        return this.tokensService.getValidToken(token, type);
    }

    /**
     * @param {string} token
     * @returns {Promise}
     */
    dropToken (token) {
        return this.tokensService.dropToken(token);
    }

    /**
     * @param {Group[]} [userGroups=[]]
     * @param {string} [userId=null]
     * @returns {UserAccessor}
     */
    createUserAccessor (userGroups = [], userId = null) {
        return new UserAccessor(
            userGroups,
            userId,
            this._options.superGroup,
            this._options.adminGroups);
    }

}

module.exports = AuthService;
