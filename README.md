# Identity

- manages users
- registers
- authorizes
- autenticates
- distributes tokens

-----------------

# API
## Classes

<dl>
<dt><a href="#AuthService">AuthService</a></dt>
<dd></dd>
<dt><a href="#Authorizator">Authorizator</a></dt>
<dd></dd>
<dt><a href="#UsersService">UsersService</a></dt>
<dd></dd>
<dt><a href="#UserAccessor">UserAccessor</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#aclResolver">aclResolver(aclObject, [groupTree], [glue])</a> ⇒ <code>Map.&lt;string, Set.&lt;string&gt;&gt;</code></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Group">Group</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="AuthService"></a>

## AuthService
**Kind**: global class

* [AuthService](#AuthService)
    * [new AuthService(getUserByIdFn, [tokenStorage], [options], [appsProvider])](#new_AuthService_new)
    * [.expressMiddleware()](#AuthService+expressMiddleware) ⇒ <code>function</code>
    * [.createUserToken(userId, domain)](#AuthService+createUserToken) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.createPasswordResetToken(userId)](#AuthService+createPasswordResetToken) ⇒ <code>Promise</code>
    * [.getAndRemovePasswordResetToken(token)](#AuthService+getAndRemovePasswordResetToken) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
    * [.createToken(type, [userIdOrGroups], [options], [length])](#AuthService+createToken) ⇒ <code>Promise</code>
    * [.getToken(type, token)](#AuthService+getToken) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
    * [.dropToken(token)](#AuthService+dropToken) ⇒ <code>Promise</code>
    * [.createUserAccessor([userGroups], [userId])](#AuthService+createUserAccessor) ⇒ <code>[UserAccessor](#UserAccessor)</code>

<a name="new_AuthService_new"></a>

### new AuthService(getUserByIdFn, [tokenStorage], [options], [appsProvider])
Creates an instance of AuthService


| Param | Type | Default |
| --- | --- | --- |
| getUserByIdFn | <code>function</code> |  |
| [tokenStorage] | <code>TokenStorage</code> |  |
| [options] | <code>Object</code> | <code>{}</code> |
| options.acl | <code>Object</code> |  |
| options.groups | <code>Object</code> |  |
| options.tokenFactory | <code>function</code> |  |
| [options.passwordReset] | <code>Object</code> |  |
| [options.passwordReset.tokenExpiresInMinutes] | <code>number</code> |  |
| options.superGroup | <code>string</code> |  |
| options.adminGroups | <code>Array.&lt;string&gt;</code> |  |
| [options.cookieKey] | <code>string</code> |  |
| [options.signed] | <code>boolean</code> |  |
| [options.tokenType] | <code>string</code> |  |
| [appsProvider] | <code>Map.&lt;string, (Object\|Promise.&lt;Object&gt;)&gt;</code> | <code>new Map()</code> |

<a name="AuthService+expressMiddleware"></a>

### authService.expressMiddleware() ⇒ <code>function</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>
<a name="AuthService+createUserToken"></a>

### authService.createUserToken(userId, domain) ⇒ <code>Promise.&lt;Object&gt;</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Default |
| --- | --- |
| userId |  |
| domain | <code></code> |

<a name="AuthService+createPasswordResetToken"></a>

### authService.createPasswordResetToken(userId) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type |
| --- | --- |
| userId | <code>string</code> |

<a name="AuthService+getAndRemovePasswordResetToken"></a>

### authService.getAndRemovePasswordResetToken(token) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type |
| --- | --- |
| token | <code>string</code> |

<a name="AuthService+createToken"></a>

### authService.createToken(type, [userIdOrGroups], [options], [length]) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> |  |
| [userIdOrGroups] | <code>string</code> | <code>null</code> |
| [options] | <code>Object</code> |  |
| [length] | <code>number</code> |  |

<a name="AuthService+getToken"></a>

### authService.getToken(type, token) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type |
| --- | --- |
| type | <code>string</code> |
| token | <code>string</code> |

<a name="AuthService+dropToken"></a>

### authService.dropToken(token) ⇒ <code>Promise</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type |
| --- | --- |
| token | <code>string</code> |

<a name="AuthService+createUserAccessor"></a>

### authService.createUserAccessor([userGroups], [userId]) ⇒ <code>[UserAccessor](#UserAccessor)</code>
**Kind**: instance method of <code>[AuthService](#AuthService)</code>

| Param | Type | Default |
| --- | --- | --- |
| [userGroups] | <code>[Array.&lt;Group&gt;](#Group)</code> | <code>[]</code> |
| [userId] | <code>string</code> | <code>null</code> |

<a name="Authorizator"></a>

## Authorizator
**Kind**: global class
<a name="new_Authorizator_new"></a>

### new Authorizator(aclList, [superGroup])
Creates an instance of Authorizator.


| Param | Type |
| --- | --- |
| aclList | <code>Map.&lt;String, Set.&lt;String&gt;&gt;</code> |
| [superGroup] | <code>string</code> |

<a name="UsersService"></a>

## UsersService
**Kind**: global class

* [UsersService](#UsersService)
    * [new UsersService(userStorage, [config], [formatter])](#new_UsersService_new)
    * [.storage](#UsersService+storage) : <code>MongoDbUserStorage</code>

<a name="new_UsersService_new"></a>

### new UsersService(userStorage, [config], [formatter])

| Param | Type | Description |
| --- | --- | --- |
| userStorage | <code>\*</code> |  |
| [config] | <code>Object</code> |  |
| [config.superGroup] | <code>string</code> |  |
| [config.adminGroups] | <code>Array.&lt;string&gt;</code> |  |
| [formatter] | <code>function</code> | user formatter |

<a name="UsersService+storage"></a>

### usersService.storage : <code>MongoDbUserStorage</code>
**Kind**: instance property of <code>[UsersService](#UsersService)</code>
<a name="UserAccessor"></a>

## UserAccessor
**Kind**: global class

* [UserAccessor](#UserAccessor)
    * [new UserAccessor(userGroups, [byUserId], [superGroup], [adminGroups])](#new_UserAccessor_new)
    * [.setUser([userGroups], [byUserId])](#UserAccessor+setUser)
    * [.isMe([userId])](#UserAccessor+isMe) ⇒ <code>boolean</code>
    * [.isRelated(groups)](#UserAccessor+isRelated) ⇒ <code>boolean</code>
    * [.isAdministrable(groups)](#UserAccessor+isAdministrable) ⇒ <code>boolean</code>
    * [.filterGroups(groupList, personId, [justManageable])](#UserAccessor+filterGroups) ⇒ <code>[Array.&lt;Group&gt;](#Group)</code>

<a name="new_UserAccessor_new"></a>

### new UserAccessor(userGroups, [byUserId], [superGroup], [adminGroups])

| Param | Type | Default |
| --- | --- | --- |
| userGroups | <code>[Array.&lt;Group&gt;](#Group)</code> |  |
| [byUserId] | <code>string</code> | <code>null</code> |
| [superGroup] | <code>string</code> | <code>null</code> |
| [adminGroups] | <code>Array.&lt;string&gt;</code> | <code></code> |

<a name="UserAccessor+setUser"></a>

### userAccessor.setUser([userGroups], [byUserId])
**Kind**: instance method of <code>[UserAccessor](#UserAccessor)</code>

| Param | Type | Default |
| --- | --- | --- |
| [userGroups] | <code>[Array.&lt;Group&gt;](#Group)</code> | <code></code> |
| [byUserId] | <code>string</code> | <code>null</code> |

<a name="UserAccessor+isMe"></a>

### userAccessor.isMe([userId]) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[UserAccessor](#UserAccessor)</code>

| Param | Type |
| --- | --- |
| [userId] | <code>string</code> |

<a name="UserAccessor+isRelated"></a>

### userAccessor.isRelated(groups) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[UserAccessor](#UserAccessor)</code>

| Param | Type |
| --- | --- |
| groups | <code>[Array.&lt;Group&gt;](#Group)</code> |

<a name="UserAccessor+isAdministrable"></a>

### userAccessor.isAdministrable(groups) ⇒ <code>boolean</code>
**Kind**: instance method of <code>[UserAccessor](#UserAccessor)</code>

| Param | Type |
| --- | --- |
| groups | <code>[Array.&lt;Group&gt;](#Group)</code> |

<a name="UserAccessor+filterGroups"></a>

### userAccessor.filterGroups(groupList, personId, [justManageable]) ⇒ <code>[Array.&lt;Group&gt;](#Group)</code>
**Kind**: instance method of <code>[UserAccessor](#UserAccessor)</code>

| Param | Type | Default |
| --- | --- | --- |
| groupList | <code>[Array.&lt;Group&gt;](#Group)</code> |  |
| personId | <code>string</code> |  |
| [justManageable] | <code>boolean</code> | <code>false</code> |

<a name="aclResolver"></a>

## aclResolver(aclObject, [groupTree], [glue]) ⇒ <code>Map.&lt;string, Set.&lt;string&gt;&gt;</code>
**Kind**: global function

| Param | Type | Default |
| --- | --- | --- |
| aclObject | <code>any</code> |  |
| [groupTree] | <code>any</code> | <code></code> |
| [glue] | <code>string</code> | <code>&quot;&#x27;.&#x27;&quot;</code> |

<a name="Group"></a>

## Group : <code>Object</code>
**Kind**: global typedef
**Properties**

| Name | Type |
| --- | --- |
| group | <code>string</code> |
| domain | <code>string</code> |

