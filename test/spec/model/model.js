describe('model.js', function() {
  describe('getFiles', function() {
    var tree = data.tree;

    it('should be a function', function() {
      expect(getFiles).to.be.a('function');
    })

    describe('tree', function() {
      it('returns tree if it exists', function() {
        expect(getFiles().tree).to.not.exist;
        expect(getFiles([]).tree).to.exist;
        expect(getFiles(tree).tree).to.exist;
      });

      it('returns same tree as input if it exists', function() {
        expect(getFiles(tree).tree).to.eql(tree);
      });

      it('returns files and total', function() {
        expect(getFiles(tree).files).to.exist;
        expect(getFiles(tree).total).to.exist;
      });

      it('returns correct number of files in files array', function() {
        expect(getFiles(tree).files).to.have.length(3);
      });

      it('returns correct number of files as total', function() {
        var treeFiles = getFiles(tree);
        expect(treeFiles.total).to.equal(treeFiles.files.length);
      });
    });

    describe('matchesPath', function() {
      it('returns only files at root if path is empty string', function() {
        expect(getFiles(tree, '').files).to.have.length(3);
      });

      it('returns only files in path directory', function() {
        expect(getFiles(tree, 'a/aa').files).to.have.length(1);
        expect(getFiles(tree, 'b').files).to.have.length(0);
      });
    });

    describe('matchesSearch', function() {
      it('returns only files and folders matching searchstr', function() {
        expect(getFiles(tree, '', 'a').files).to.have.length(3);
      });

      it('returns only files and folders in path matching searchstr', function() {
        expect(getFiles(tree, 'a', 'a').files).to.have.length(2);
      });
    });
  });
});
