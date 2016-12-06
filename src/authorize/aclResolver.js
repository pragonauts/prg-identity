/*
 * @author David Menger
 */
'use strict';

function createParentsSetMap (groupTree) {
    const ret = new Map();
    Object.keys(groupTree).forEach((group) => {
        const childMap = createParentsSetMap(groupTree[group]);
        const set = new Set();
        for (const [key, value] of childMap) {
            set.add(key);
            if (ret.has(key)) {
                throw new Error(`Detected circular reference in groupTree: ${key}`);
            }
            ret.set(key, value);
        }
        if (ret.has(group)) {
            throw new Error(`Detected circular reference in groupTree: ${group}`);
        }
        ret.set(group, set);
    });
    return ret;
}

function createGroupSet (groups, parents) {
    const ret = new Set();
    for (const group of groups) {
        ret.add(group);

        if (!parents.has(group)) {
            continue;
        }

        for (const parentGroup of parents.get(group)) {
            ret.add(parentGroup);
        }
    }
    return ret;
}

function crawlAclTree (resultMap, aclObject, glue, parents, stack = []) {
    for (const resource of Object.keys(aclObject)) {
        stack.push(resource);
        if (Array.isArray(aclObject[resource])) {
            const groups = createGroupSet(aclObject[resource], parents);
            resultMap.set(stack.join(glue), groups);
        } else {
            crawlAclTree(resultMap, aclObject[resource], glue, parents, stack);
        }
        stack.pop();
    }
    return resultMap;
}


/**
 *
 *
 * @param {any} aclObject
 * @param {any} [groupTree=null]
 * @param {string} [glue='.']
 * @returns {Map<string, Set<string>>}
 */
function aclResolver (aclObject, groupTree = null, glue = '.') {
    const resultMap = new Map();
    const parents = createParentsSetMap(groupTree || {});

    return crawlAclTree(resultMap, aclObject, glue, parents);
}

module.exports = aclResolver;
