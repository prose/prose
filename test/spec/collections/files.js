var _ = require('underscore');
var spies = require('../../mocks/helpers').spies;
var fileCollectionMocker = require('../../mocks/collections/files');
var fileMocker = require('../../mocks/models/file');
var stringMeta = require('../../fixtures/metadata.js').string;
var formMeta = require('../../fixtures/metadata.js').forms;
var cookie = require('../../../app/cookie');

describe('files collection', function() {

  before(function() {
    // Shim cookies due to chrome security features
    Object.defineProperty(document, 'cookie', {
      get: function () {
        return this.value || '';
      },
      set: function (cookie) {
        cookie = cookie || '';
   
        const cutoff = cookie.indexOf(';');
        const pair = cookie.substring(0, cutoff >= 0 ? cutoff : cookie.length);
        const cookies = this.value ? this.value.split('; ') : [];
   
        cookies.push(pair);
   
        return this.value = cookies.join('; ');
      }
    });
  });

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
        expect(files.defaults._posts.date && _.isDate(new Date(files.defaults._posts.date))).to.eql(true);
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

  it('Honors CURRENT_USER var when metadata is a string', function(done) {
    cookie.set('login', 'user');
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(stringMeta), {
      success: function() {
        expect(files.defaults._posts.user).to.eql('user');
        done();
      }
    });
  });

  it('Honors CURRENT_USER var with mapped user when metadata is a form element', function(done) {
    // test case for when there's a user
    cookie.set('login', 'user-with-alias');
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(formMeta), {
      success: function() {
        expect(files.config.rooturl).to.eql('root/user-alias/folder');
        expect(files.config.media).to.eql('media/user-alias/folder');
        expect(files.config.siteurl).to.eql('site/user-alias/folder');
        expect(files.defaults._posts[1].field.value).to.eql('user-alias');
        cookie.unset('login')
        done();
      }
    });
  });

  it('Honors CURRENT_USER var with unmapped user when metadata is a form element', function(done) {
    cookie.set('login', 'user-with-no-alias');
    var files = fileCollectionMocker();
    files.parseConfig(fileMocker(formMeta), {
      success: function() {
        expect(files.config.rooturl).to.eql('root/user-with-no-alias/folder');
        expect(files.config.media).to.eql('media/user-with-no-alias/folder');
        expect(files.config.siteurl).to.eql('site/user-with-no-alias/folder');
        expect(files.defaults._posts[1].field.value).to.eql('user-with-no-alias');
        cookie.unset('login')
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
