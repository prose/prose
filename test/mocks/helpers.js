
var sinon = require('sinon');

module.exports = {
  spies: spies,
  distate: new Distate()
}

/**
 * naive state management for the ad-hoc DI we're doing in the mocks.
 * used by mocks to keep track of objects so that, e.g., a mocked File
 * and mocked Branch would hold references to same actual (mock) Repo
 * object.  This models the behavior in the app and should make tests 
 * easier to write.
 */
function Distate() {
}

/**
* Clear the di state (for use between tests).
*/
Distate.prototype.reset = function() {
  for(var k in this) delete this[k];
}

/**
 * Register the given mock function with the DI state instance:
 *  - bind distate as the 'this' context for the given
 *  - attach 'reset' as a property so tests don't ever have to require
 *    the helper, but can rather just do, e.g., mockFileFunction.reset().
 * 
 * @return the bound function.
 */
Distate.prototype.register = function(mockFunction) {
  var bound = mockFunction.bind(this);
  bound.reset = this.reset.bind(this);
  return bound;
}

/**
 * Attach spies for the given methods
 *
 * @param {object} [object] The object to attach spies to; uses {} if omitted.
 * @param {Array<string>} methods Array of method names to make spies for.
 * @returns The given (or newly created) object.
 */
function spies(object, methods) {
  if(!methods) {
    methods = object;
    object = {};
  }
  methods.forEach(function(methodName) {
    object[methodName] = sinon.spy();
  });
  return object;
}
