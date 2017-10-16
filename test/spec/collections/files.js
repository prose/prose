var _ = require('underscore');
var spies = require('../../mocks/helpers').spies;
var fileCollectionMocker = require('../../mocks/collections/files');
var fileMocker = require('../../mocks/models/file');
var stringMeta = require('../../fixtures/metadata.js').string;
var formMeta = require('../../fixtures/metadata.js').forms;
var cookie = require('../../../app/cookie');

describe('files collection', function() {

  beforeEach(function() {
    fileCollectionMocker.reset();
    fileMocker.reset();
  });

  it('Honors CURRENT_DATETIME var when metadata is a string', function(done) {
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(stringMeta), {
      success: function() {
        expect(files).to.have.property('defaults');
        expect(files.defaults._posts.date).to.not.eql('CURRENT_DATETIME');
        expect(_.isDate(new Date(files.defaults._posts.date))).to.eql(true);
        done();
      }
    });
  });

  it('Honors CURRENT_DATETIME var when metadata is a form element', function(done) {
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(formMeta), {
      success: function() {
        var date = new Date(files.defaults._posts[0].field.value);
        expect(_.isDate(date)).to.eql(true);
        done();
      }
    });
  });

  it('Honors CURRENT_USER var with mapped user when metadata is a form element', function(done) {
    cookie.set('login', 'github1');
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(formMeta), {
      success: function() {
        expect(files.config.rooturl).to.eql('root/usr1/folder');
        expect(files.config.media).to.eql('media/usr1/folder');
        expect(files.config.siteurl).to.eql('site/usr1/folder');
        expect(files.defaults._posts[1].field.value).to.eql('usr1');
        done();
      }
    });
  });

  it('Honors CURRENT_USER var with unmapped user when metadata is a form element', function(done) {
    cookie.set('login', 'github2');
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(formMeta), {
      success: function() {
        expect(files.config.rooturl).to.eql('root/github2/folder');
        expect(files.config.media).to.eql('media/github2/folder');
        expect(files.config.siteurl).to.eql('site/github2/folder');
        expect(files.defaults._posts[1].field.value).to.eql('github2');
        done();
      }
    });
  });

  it('Extends config object with config.prose settings', function(done) {
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(stringMeta), {
      success: function() {
        expect(files.config.proseProp).to.eql(true);
        expect(files.config.configProp).to.eql(true);
        done();
      }
    });
  });

});
