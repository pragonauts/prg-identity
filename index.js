/**
 * Created by Václav on 06.12.2016.
 */

'use strict';

const aclResolver = require('./src/authorize/aclResolver');
const AuthenticateService = require('./src/authenticate/AuthenticateService');
const Authorizator = require('./src/authorize/Authorizator');
const UserService = require('./src/users/UsersService');
const UserAccessor = require('./src/users/UserAccessor');
const AuthService = require('./src/AuthService');


module.exports = {

    AuthService,

    AuthenticateService,

    Authorizator,

    aclResolver,

    UserService,

    UserAccessor,

    get MongoDbTokenStorage () {
        // lazy load - because of optional dependencies (mongodb)
        return require('./src/tokens/MongoDbTokenStorage'); // eslint-disable-line global-require
    },

    get MongoDbUserStorage () {

        throw new Error('NOT COVERED BY TESTS YET');

        // lazy load - because of optional dependencies (mongodb)
        // return require('./src/users/MongoDbUserStorage'); // eslint-disable-line global-require
    }

};
