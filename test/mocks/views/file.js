var FileView = require('../../../app/views/file'),
  distate = require('../helpers').distate,
  mockFile = require('../models/file'),
  mockBranches = require('../collections/branches'),
  mockRepo = require('../models/repo'),
  mockApp = require('./app'),
  mockRouter = require('../router');

module.exports = distate.register(file);

function file() {
  var app = mockApp();

  // Calling render sets up user, navbar, and sidebar views
  // This prevents many errors down the line
  app.render();
  return new FileView({
    app: app,
    branch: 'master',
    branches: mockBranches(),
    mode: 'edit',
    nav: mockApp().nav,
    name: 'file.md',
    path: 'file.md',
    repo: mockRepo(),
    router: mockRouter(),
    sidebar: mockApp().sidebar,
    model: mockFile()
  });
}
