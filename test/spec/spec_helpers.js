if (typeof mocha !== 'undefined') {
  // mocha.setup for browser options
  // cli options defined in spec_helpers
  mocha.setup({
    ui: 'bdd'
  });
}

var chai = chai || require('chai');
var expect = chai.expect;
chai.should();

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
