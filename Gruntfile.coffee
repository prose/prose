module.exports = (grunt) ->
  
  grunt.initConfig
    pkg: grunt.file.readJSON 'package.json'

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
          
    clean:
      app: "_app.coffee"
      dsstore: "**/.DS_Store"
    
    coffeelint:
      app: ["_cs/*.coffee", "_cs/*/*.coffee"]
      
    coffeelintOptions:
      max_line_length:
        level: "ignore"
      
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
          
  grunt.registerTask 'default', ["concat", "coffeelint", "coffee", "uglify", "clean"]
