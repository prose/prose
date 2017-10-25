var jsyaml = require('js-yaml');

module.exports.string = jsyaml.safeDump({
  prose: {
    metadata: {
      _posts: 'date: CURRENT_DATETIME\nuser: CURRENT_USER'
    },
    proseProp: true
  },
  configProp: true
});

module.exports.forms = jsyaml.safeDump({
  prose: {
    rooturl: 'root/CURRENT_USER/folder',
    media: 'media/CURRENT_USER/folder',
    siteurl: 'site/CURRENT_USER/folder',
    metadata: {
      _posts: [{
        name: 'date',
        field: {
          element: 'textarea',
          value: 'CURRENT_DATETIME'
        }
      }, {
        name: 'author',
        field: {
          element: 'textarea',
          value: 'CURRENT_USER'
        }
      }]
    },
    users: [{
      login: 'user-with-alias',
      user: 'user-alias'
    }]
  }
});
