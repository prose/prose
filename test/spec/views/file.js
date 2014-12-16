
var FileView = require('../../../app/views/file'),
    mocks = require('../mocks');

describe('File view', function() {
  var mock, fileView;

  beforeEach(function() {
    mock = mocks();
  });

  describe('in edit mode', function() {

    beforeEach(function() {
      mock = mocks();
      fileView = new FileView({
        app: mock.app(),
        branch: 'master',
        branches: mock.branches(),
        mode: 'edit',
        nav: mock.app().nav,
        name: 'file.md',
        path: 'file.md',
        repo: mock.repo(),
        router: mock.router(),
        sidebar: mock.app().sidebar
      });
    });

    it('creates the CodeMirror editor', function() {
      fileView.model = mock.file()
      fileView.collection = fileView.model.collection;
      fileView.render();

      expect(fileView.editor).to.be.ok;
    })

    it('initializes CodeMirror with the file\'s contents', function() {
      var content = 'the file contents';
      fileView.model = mock.file(content)
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
