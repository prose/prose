
var FileView = require('../../../app/views/file'),
    mockBranches = require('../../mocks/collections/branches'),
    mockRepo = require('../../mocks/models/repo'),
    mockFile = require('../../mocks/models/file'),
    mockApp = require('../../mocks/views/app'),
    mockRouter = require('../../mocks/router'),
    Handsontable = require('handsontable');


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

    it('creates the Hansontable editor', function() {
      fileView.model = mockFile();
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
      fileView.model = mockFile();
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

    describe('#defaulUploadPath', function() {
        beforeEach(function() {
            fileView.model = mockFile()
            fileView.model.set('path', '/path/to/fake.md')
        });
        context('with config', function() {
            beforeEach(function() {
                fileView.config = { "media": "/configured/assets" };
            });
            it('uses the configured upload path', function() {
                expect(fileView.defaultUploadPath('my-image.jpg')).to.equal("/configured/assets/my-image.jpg");
            });
        });
        context('without config', function() {
            beforeEach(function() {
                fileView.config = null;
            });
            it('uses the files directory', function() {
                expect(fileView.defaultUploadPath('my-image.jpg')).to.equal("/path/to/my-image.jpg");
            });
        });
    });

    describe('#post', function() {
      it('does not set title as placeholder when publishing from draft', function(done) {
        fileView.model = mockFile();
        fileView.model.set('path', '_drafts/post.md');
        fileView.model.set({
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
        fileView.model = mockFile();
        fileView.model.set('path', '_posts/post.md');
        fileView.model.set({
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
