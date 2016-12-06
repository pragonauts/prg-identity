/*
 * @author David Menger
 */
'use strict';

class UserFactory {

    constructor (data = {}) {

        const { email, username, name } = data;

        this.email = email;

        this.username = username;

        this.name = name;

        this.auths = [];
    }

    addAuthentication (authentication) {
        this.auths.push(authentication);
    }

    createUserObject () {
        // just pack all properties
        return Object.assign({}, this);
    }

}

module.exports = UserFactory;
