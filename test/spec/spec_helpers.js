if (typeof mocha !== 'undefined') {
  // mocha.setup for browser options
  // cli options defined in /test/mocha.opts
  mocha.setup({
    ui: 'bdd'
  });
}

if (typeof chai !== 'undefined') {
  // browser init
  var expect = chai.expect;
} else {
  var chai = require('chai');

  // bad practice, but allows simple, portable test specs
  GLOBAL.expect = chai.expect;
}

chai.use(function (chai, utils) {
  var flag = utils.flag;

  chai.Assertion.addMethod('classed', function (className) {
    this.assert(
      flag(this, 'object').classed(className),
      'expected #{this} to be classed #{exp}',
      'expected #{this} not to be classed #{exp}',
      className
    );
  });
});
