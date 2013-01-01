fs = require "fs"
{exec} = require "child_process"

files = "cs/views/*.coffee cs/routers/*.coffee cs/util cs/model cs/init"

task "compile", "compile coffeescript files to javascript", ->
  compile()

task "watch", "compile coffeescript files and watch for changes", ->
  watch()

task "build", "compile and minify coffeescript files", ->
  build()
  
build = (callback) ->
  compile -> minify()
  
compile = (callback) ->
  exec "coffee --output _includes/ --join app --compile " + files, (err, stdout, stderr) ->
    throw err if err
  console.log "compiled app.js"
  callback?()
  

watch = (callback) ->
  exec "coffee --watch --output _includes/ --join app --compile " + files, (err, stdout, stderr) ->
    throw err if err
  console.log "compiled app.js... watching"
  callback?() 
  
minify = (callback) ->
  exec "uglifyjs --overwrite _includes/app.js", (err, stdout, stderr) ->
    throw err if err
  console.log "minified app.js"
  callback?()