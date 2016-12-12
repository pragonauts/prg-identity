'use strict';


'use strict';

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname, '..', 'README.md');

const readme = fs.readFileSync(filename, 'utf8');

const separator = '\n-----------------\n\n# API\n';
const beginning = readme.split(separator)[0];

const apiDoc = jsdoc2md.renderSync({
    'example-lang': 'javascript',
    files: [
        'src/AuthService.js',
        'src/authenticate/AuthenticateService.js',
        'src/authorize/Authorizator.js',
        'src/authorize/aclResolver.js',
        'src/users/UsersService.js',
        'src/users/UserAccessor.js'
    ]
});

// eslint-disable-next-line
console.log(apiDoc);

fs.writeFileSync(filename, `${beginning}${separator}${apiDoc}`);
