var Files = require('../../../app/collections/files'),
  spies = require('../helpers').spies,
  distate = require('../helpers').distate,
  mockRepo = require('../models/repo'),
  mockBranch = require('../models/branch');

module.exports = distate.register(files);

function files() {
  return this._files = this._files ||
    spies(new Files([], {
      repo: mockRepo(),
      branch: mockBranch(),
      sha: 'fakesha'
    }), ['fetch']);
}
