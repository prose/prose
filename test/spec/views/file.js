var _ = require('underscore');

var FileView = require('../../../app/views/file');
var mockBranches = require('../../mocks/collections/branches');
var mockRepo = require('../../mocks/models/repo');
var mockFile = require('../../mocks/models/file');
var mockApp = require('../../mocks/views/app');
var mockRouter = require('../../mocks/router');
var Handsontable = require('handsontable');


describe('File view', function() {
  var fileView;

  beforeEach(function() {
    mockApp.reset(); // reset the DI state between tests.

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
    fileView.model = mockFile();
    var clone = fileView.model.clone;
    fileView.model.clone = function () {
      return mockFile();
    }
    fileView.collection = fileView.model.collection;
  });

  describe('in edit mode', function() {

    it('creates the CodeMirror editor', function() {
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

    it('creates the Hansontable editor', function() {
      fileView.model.set('lang', 'csv');
      fileView.collection = fileView.model.collection;
      fileView.render();
      expect(fileView.editor).to.be.an.instanceof(Handsontable.Core);
    })

    it('initializes Handsontable with the file\'s contents as structured data', function() {
      var content = 'a,b\r\nfoo,bar';
      fileView.model = mockFile(content);
      fileView.model.set('lang', 'csv');
      fileView.collection = fileView.model.collection;
      fileView.render();
      expect(fileView.editor.getSourceData()).to.deep.equal([['a', 'b'], ['foo', 'bar']]);
    })

    it('retrieves Handsontable contents as a string', function() {
      var content = 'a,b\r\nfoo,bar';
      fileView.model = mockFile(content);
      fileView.model.set('lang', 'csv');
      fileView.collection = fileView.model.collection;
      fileView.render();
      expect(fileView.editor.getValue()).to.equal(content);
    })

    it('creates a placeholder title for new files', function() {
      fileView.model.set({
        defaults: [{name: 'title'}]
      });
      fileView.model.isNew = function() { return true };
      fileView.collection = fileView.model.collection;
      // quash an error requiring templates in an un-related view.
      fileView.renderMetadata = function() {};
      fileView.render();
      expect(fileView.subviews.header.options.placeholder).to.equal(true);
    });

    describe('#defaultUploadPath', function() {
      context('with config', function() {
        it('uses the configured upload path', function() {
          fileView.model.set('path', '/path/to/fake.md')
          fileView.config = { "media": "/configured/assets" };
          expect(fileView.defaultUploadPath('my-image.jpg')).to.equal("/configured/assets/my-image.jpg");
        });
      });
      context('without config', function() {
        it('uses the files directory', function() {
          fileView.model.set('path', '/path/to/fake.md')
          fileView.config = null;
          expect(fileView.defaultUploadPath('my-image.jpg')).to.equal("/path/to/my-image.jpg");
        });
      });
    });

    describe('#post', function() {
      it('does not set title as placeholder when publishing from draft', function(done) {
        fileView.model.set({
          path: '_drafts/post.md',
          defaults: [{name: 'title'}],
          metadata: {title: 'foo'}
        });
        fileView.collection = fileView.model.collection;
        // quash an error requiring templates in an un-related view.
        fileView.renderMetadata = function() {};
        fileView.post();
        window.setTimeout(function() {
          if (fileView.subviews.header.options.placeholder) {
            done(new Error('Expected placeholder to be false'));
          }
          done();
        }, 400);
      });
    });

    describe('#draft', function() {
      it('does not set title as placeholder when creating draft', function(done) {
        fileView.model.set({
          path: '_posts/post.md',
          defaults: [{name: 'title'}],
          metadata: {title: 'foo'}
        });
        fileView.collection = fileView.model.collection;
        // quash an error requiring templates in an un-related view.
        fileView.renderMetadata = function() {};
        fileView.draft();
        window.setTimeout(function() {
          if (fileView.subviews.header.options.placeholder) {
            done(new Error('Expected placeholder to be false'));
          }
          done();
        }, 400);
      });
    });

  });

  describe('in preview mode', function() {
      it('escapes script tags when compiling preview', function() {
          var content = "<script>alert('pwned')</script>";
          expect(fileView.compilePreview(content)).to.equal('&lt;script&gt;alert(&#x27;pwned&#x27;)&lt;&#x2F;script&gt;');
      });
  });

});
