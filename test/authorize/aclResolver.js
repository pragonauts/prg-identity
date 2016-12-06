/*
 * @author David Menger
 */
'use strict';

const { aclResolver } = require('../../index');
const assert = require('assert');

const ACL_OBJECT = {
    simpleResource: ['guest', 'master', 'editor'],
    sophisticatedResource: {
        view: ['editor'],
        edit: ['master', 'superMaster'],
        remove: ['anotherMaster']
    },
    readersResource: ['reader']
};

describe('aclResolver()', function () {

    it('should resolve groups', function () {
        const groupTree = {
            guest: {
                editor: {
                    master: {
                        superMaster: {}
                    },
                    anotherMaster: {}
                }
            },
            user: {
                reader: {}
            }
        };

        const res = aclResolver(ACL_OBJECT, groupTree);

        const comparable = Array.from(res.keys())
            .reduce((ret, key) => Object.assign(ret, {
                [key]: Array.from(res.get(key)).sort()
            }), {});

        assert.deepEqual(comparable, {
            simpleResource: ['anotherMaster', 'editor', 'guest', 'master', 'superMaster'],
            readersResource: ['reader'],
            'sophisticatedResource.view': ['anotherMaster', 'editor', 'master', 'superMaster'],
            'sophisticatedResource.edit': ['master', 'superMaster'],
            'sophisticatedResource.remove': ['anotherMaster']
        });
    });

    it('should detect circular references', function () {
        assert.throws(() => {
            const groupTree = {
                guest: {
                    editor: {
                        master: {
                            guest: {}
                        },
                        anotherMaster: {}
                    }
                },
                user: {
                    reader: {}
                }
            };

            aclResolver(ACL_OBJECT, groupTree);
        });

        assert.throws(() => {
            const groupTree = {
                guest: {
                    editor: {
                        master: {
                            superMaster: {}
                        },
                        anotherMaster: {}
                    }
                },
                user: {
                    superMaster: {}
                }
            };

            aclResolver(ACL_OBJECT, groupTree);
        });
    });

    it('should work without grouptree', function () {
        const res = aclResolver(ACL_OBJECT);

        const comparable = Array.from(res.keys())
            .reduce((ret, key) => Object.assign(ret, {
                [key]: Array.from(res.get(key)).sort()
            }), {});

        assert.deepEqual(comparable, {
            simpleResource: ['editor', 'guest', 'master'],
            readersResource: ['reader'],
            'sophisticatedResource.view': ['editor'],
            'sophisticatedResource.edit': ['master', 'superMaster'],
            'sophisticatedResource.remove': ['anotherMaster']
        });
    });

});
