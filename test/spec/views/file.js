
var FileView = require('../../../app/views/file'),
    mockBranches = require('../../mocks/collections/branches'),
    mockRepo = require('../../mocks/models/repo'),
    mockFile = require('../../mocks/models/file'),
    mockApp = require('../../mocks/views/app'),
    mockRouter = require('../../mocks/router');


describe('File view', function() {
  var fileView;

  beforeEach(function() {
    mockApp.reset(); // reset the DI state between tests.
  });

  describe('in edit mode', function() {

    beforeEach(function() {
      fileView = new FileView({
        app: mockApp(),
        branch: 'master',
        branches: mockBranches(),
        mode: 'edit',
        nav: mockApp().nav,
        name: 'file.md',
        path: 'file.md',
        repo: mockRepo(),
        router: mockRouter(),
        sidebar: mockApp().sidebar
      });
    });

    it('creates the CodeMirror editor', function() {
      fileView.model = mockFile()
      fileView.collection = fileView.model.collection;
      fileView.render();

      expect(fileView.editor).to.be.ok;
    })

    it('initializes CodeMirror with the file\'s contents', function() {
      var content = 'the file contents';
      fileView.model = mockFile(content)
      fileView.collection = fileView.model.collection;
      fileView.render();
      expect(fileView.editor.getValue()).to.equal(content)
    })
  });

  describe('in preview mode', function() {
      it('escapes script tags when compiling preview', function() {
          var content = "<script>alert('pwned')</script>";
          expect(fileView.compilePreview(content)).to.equal('&lt;script&gt;alert(&#x27;pwned&#x27;)&lt;&#x2F;script&gt;');
      });
  });

});
