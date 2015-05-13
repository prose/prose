var jsyaml = require('js-yaml');

module.exports.string = jsyaml.safeDump({
  prose: {
    metadata: {
      _posts: [
        'date: CURRENT_DATETIME'
      ]
    }
  }
});

module.exports.form = jsyaml.safeDump({
  prose: {
    metadata: {
      _posts: [{
        name: 'date',
        field: {
          element: 'textarea',
          value: 'CURRENT_DATETIME'
        }
      }]
    }
  }
});
