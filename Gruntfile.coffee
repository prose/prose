module.exports = (grunt) ->
  
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'
    
    watch:
      cs:
        files: ["_cs/*", "_cs/*/*"]
        tasks: [ 'coffeelint', 'concat', 'coffee']
        options:
          interrupt: true
          forceWatchMethod: 'old'
      jst:
        files: ["_templates/*"]
        tasks: 'jst'
        options:
          interrupt: true
          forceWatchMethod: 'old' 
      css:
        files: ["_styles/*"]
        tasks: 'mincss'
        options:
          interrupt: true
          forceWatchMethod: 'old'
          
    concat:
      app:
        src:  [ "_cs/views/*", "_cs/routers/*", "_cs/util.coffee", "_cs/model.coffee", "_cs/init.coffee"]
        dest: "_app.coffee"
    
    coffee:
      app:
        files:
          "_includes/app.js": "_app.coffee"
          
    uglify:
      app:
        files:
          "_includes/app.js": "_includes/app.js"
          "_includes/templates.js": "_includes/templates.js"
          
    clean:
      app: "_app.coffee"
      dsstore: "**/.DS_Store"
    
    coffeelint:
      app: ["_cs/*.coffee", "_cs/*/*.coffee"]
      
    coffeelintOptions:
      max_line_length:
        level: "ignore"
        
    jst:
      app:
        options:
          processName: (filename) ->
            filename.replace('_templates/', '').replace('._', '')
          namespace: "app.templates"
        files:
          "_includes/templates.js": "_templates/*._"
          
    mincss:
      app:
        files:
          "_includes/styles/style.css": "_styles/style.css" 
      reset:
        files:  
          "_includes/styles/reset.css": "_styles/reset.css" 
      codemiror:
        files:
          "_includes/styles/codemirror.css": "_styles/codemirror.css" 
      
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-mincss'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-jekyll'
  grunt.loadNpmTasks 'grunt-contrib-imagemin'
  grunt.loadNpmTasks 'grunt-css'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-jst'
  
  grunt.registerTask 'cs', [ 'coffeelint', 'concat', 'coffee']
  grunt.registerTask 'default', ["concat", "coffeelint", "coffee", "jst", "uglify", "mincss", "clean"]
