var HeaderView = require('../../../app/views/header'),
  distate = require('../helpers').distate,
  mockFile = require('../models/file'),
  mockRepo = require('../models/repo');

module.exports = distate.register(header);

function header() {
  return new HeaderView({
    user: {},
    repo: mockRepo(),
    file: mockFile,
    input: '',
    title: 'title',
    placeholder: '',
    alterable: true
  });
}
