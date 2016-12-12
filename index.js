/**
 * Created by Václav on 06.12.2016.
 */

'use strict';

const AuthService = require('./src/AuthService');
const AuthenticateService = require('./src/authenticate/AuthenticateService');
const Authorizator = require('./src/authorize/Authorizator');
const aclResolver = require('./src/authorize/aclResolver');
const UserService = require('./src/users/UsersService');
const UserAccessor = require('./src/users/UserAccessor');


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

    get mongodbTokenFactory () {
        // lazy load - because of optional dependencies (mongodb)
        return require('./src/tokens/mongodbTokenFactory'); // eslint-disable-line global-require
    },

    get MongoDbUserStorage () {
        // lazy load - because of optional dependencies (mongodb)
        return require('./src/users/MongoDbUserStorage'); // eslint-disable-line global-require
    }

};
