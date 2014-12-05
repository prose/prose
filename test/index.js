
var path = require('path');

global.chair = require('chai'),
global.sinon = require('sinon'),
global.sinonChai = require('sinon-chai');
global.expect = chai.expect;

chai.use(sinonChai);


require('./spec/vendor/liquid.patch.js');

require('./spec/boot');
require('./spec/models/repo');
require('./spec/models/file');
