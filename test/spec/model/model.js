describe('Array', function() {
  var tree;
  var path;
  var searchstr;

  describe('getFiles', function() {
    it('should be a function', function() {
      expect(getFiles).to.be.a('function');
    })

    it('should return tree', function() {
      expect(getFiles(tree, path, searchstr)).to.exist;
    });
  });
});
