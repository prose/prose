var Branch = require('../../../app/models/branch'),
  distate = require('../helpers').distate,
  mockRepo = require('./repo');

module.exports = distate.register(branch);

function branch(name, repo) {
  repo = mockRepo(repo);
  name = name || 'master';
  var branch = repo.branches.findWhere({
    name: name
  });
  if (!branch) {
    branch = new Branch({
      repo: repo,
      name: name,
      commit: {
        sha: 'fakesha'
      }
    });
    repo.branches.add(branch);
  }
  return branch;
}
