module.exports = {
  dragEnter: function(e) {
    $(e.target).addClass('drag-over');
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

  dragLeave: function(e) {
    $(e.target).removeClass('drag-over');
    e.stopPropagation();
    e.preventDefault();
    return false;
  },

  dragDrop: function($el, cb) {
    var that = this;
    $el.on('dragenter', this.dragEnter).
        on('dragover',  this.dragOver).
        on('dragleave', this.dragLeave).
        on('drop', function(e) {
          that.drop(e, cb);
        });
  },

  drop: function(e, cb) {
    e.preventDefault();
    e = e.originalEvent

    var files = e.dataTransfer.files;

    for (var i = 0; i < files.length; i++) {
      // Only upload images
      if (/image/.test(files[i].type)) {
        cb(files[i]);
      }
    };
  }
}
