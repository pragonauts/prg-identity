/*
 * @author David Menger
 */
'use strict';

const PasswordAuthenticate = require('./PasswordAuthenticate');
const RemoteAuthenticate = require('./RemoteAuthenticate');
const errors = require('./errors');

class AuthenticateService {

    constructor (userStorage) {

        this.errors = errors;

        this.password = new PasswordAuthenticate(userStorage);

        this.remote = new RemoteAuthenticate(userStorage);
    }

}

module.exports = AuthenticateService;
