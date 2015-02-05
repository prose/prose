var Branches = require('../../../app/collections/branches'),
  spies = require('../helpers').spies,
  distate = require('../helpers').distate,
  mockRepo = require('../models/repo');

module.exports = distate.register(branch);

function branch(repo) {
  return this._branches = this._branches ||
    spies(new Branches([], {
      repo: mockRepo(repo)
    }), ['fetch']);
}
