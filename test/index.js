
var path = require('path');

global.chai = require('chai'),
global.sinon = require('sinon'),
global.sinonChai = require('sinon-chai');
global.expect = chai.expect;

chai.use(sinonChai);

// load tests
require('./spec/vendor/liquid.patch.js');
require('./spec/vendor/codemirror');
require('./spec/boot');
require('./spec/router');
require('./spec/models/repo');
require('./spec/models/file');
require('./spec/views/file');
require('./spec/views/metadata');
require('./spec/views/meta-forms');
require('./spec/views/header');
require('./spec/collections/files');
