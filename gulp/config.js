// Paths always relative to root.
var config = {
  paths: {
    vendorScripts: [
      'vendor/codemirror/codemirror.js',
      'vendor/codemirror/overlay.js',
      'vendor/codemirror/htmlmixed.js',
      'vendor/codemirror/clike.js',
      'vendor/codemirror/yaml.js',
      'vendor/codemirror/ruby.js',
      'vendor/codemirror/markdown.js',
      'vendor/codemirror/xml.js',
      'vendor/codemirror/javascript.js',
      'vendor/codemirror/css.js',
      'vendor/codemirror/gfm.js',
      'vendor/liquid.js'
    ],
    app: [
      'app/**/**/*.js'
    ]
  }
}


exports = module.exports = config;

