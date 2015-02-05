var spies = require('./helpers').spies,
  distate = require('./helpers').distate;

module.exports = distate.register(router);

function router() {
  return this._router = this._router ||
    spies(['error', 'navigate', 'notify']);
}
