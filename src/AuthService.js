
/*
 * @author David Menger
 */
'use strict';

const TokensService = require('./tokens/TokensService');
const tokenFactory = require('./tokens/tokenFactory');
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
     * @param {{
     *      acl: Object
     *      groups: Object
     *      tokenFactory: function
     *      passwordReset?: {
     *          tokenExpiresInMinutes?: number
     *      },
     *      superGroup: string
     *      adminGroups: adminGroups
     *      cookieKey?: string
     *      signed?: boolean
     *      tokenType?: string
     * }} [options={}]
     * @param {Map.<string, object|Promise.<Object>>} appsProvider
     */
    constructor (
            getUserByIdFn,
            tokenStorage,
            options = {},
            appsProvider = new Map()) {

        this._options = options;

        let useTokenFactory = tokenFactory;

        if (typeof this._options.tokenFactory !== 'undefined') {
            useTokenFactory = this._options.tokenFactory;
        }

        this.tokensService = new TokensService(tokenStorage, useTokenFactory);

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

    createUserToken (userId, domain = null) {
        const options = {};

        if (domain !== null) {
            options.domain = domain;
        }

        return this.createToken(this.tokensService.TYPE_TOKEN, userId, options);
    }

    createPasswordResetToken (userId) {
        return this._passwordResetter.createToken(userId);
    }

    getAndRemovePasswordResetToken (token) {
        return this._passwordResetter.findAndRemoveToken(token);
    }

    createToken (type, userIdOrGroups = null, options = {}, length = undefined) {
        return this.tokensService.createToken(type, userIdOrGroups, options, length);
    }

    getToken (type, token) {
        return this.tokensService.getValidToken(token, type);
    }

    dropToken (token) {
        return this.tokensService.dropToken(token);
    }

    createUserAccessor (userGroups = [], userId = null) {
        return new UserAccessor(
            userGroups,
            userId,
            this._options.superGroup,
            this._options.adminGroups);
    }

}

module.exports = AuthService;
