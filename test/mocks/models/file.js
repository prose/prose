var File = require('../../../app/models/file'),
  distate = require('../helpers').distate,
  mockRepo = require('./repo'),
  mockFiles = require('../collections/files');

module.exports = distate.register(file);

function file(content, path, repo) {
  repo = mockRepo(repo);
  path = path || '/fake.md';
  content = content || 'line 1\nline 2\nline 3\n';
  return new File({
    collection: mockFiles(),
    content: content,
    path: path,
    repo: repo,
    sha: 'fakesha'
  });
}
