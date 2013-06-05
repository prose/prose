module.exports = {
  dragEnter: function(e, $el) {
    $el.addClass('drag-over');
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragOver: function(e) {
    e.originalEvent.dataTransfer.dropEffect = 'copy';
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragLeave: function(e, $el) {
    $el.removeClass('drag-over');
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragDrop: function($el, cb) {
    var that = this;
    $el.on('dragenter', function(e) {
          that.dragEnter(e, $el);
        }).
        on('dragover', that.dragOver).
        on('dragleave', function(e) {
          that.dragLeave(e, $el);
        }).
        on('drop', function(e) {
          that.drop(e, cb);
        });
  },

  fileSelect: function(e, cb) {
    var files = e.target.files;
    this.compileResult(files, cb);
  },

  drop: function(e, cb) {
    e.preventDefault();
    $(e.target).removeClass('drag-over');

    e = e.originalEvent
    var files = e.dataTransfer.files;
    this.compileResult(files, cb);
  },

  compileResult: function(files, cb) {
    for (var i = 0, f; f = files[i]; i++) {
      // Only upload images
      if (/image/.test(f.type)) {
        var reader = new FileReader();

        reader.onload = (function(currentFile) {
          return function(e) {
            cb(e, currentFile, window.btoa(e.target.result));
          };
        })(f);
      }

      reader.readAsBinaryString(f);
    };
  }
}
