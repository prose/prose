var _ = require('underscore');
var spies = require('../../mocks/helpers').spies;
var fileCollectionMocker = require('../../mocks/collections/files');
var fileMocker = require('../../mocks/models/file');
var stringMeta = require('../../fixtures/metadata.js').string;
var formMeta = require('../../fixtures/metadata.js').forms;

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

});
