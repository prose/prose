fs      = require 'fs'
path    = require 'path'
async   = require 'async'
{print} = require 'util'
{spawn} = require 'child_process'

testCodes  = []

task 'build', 'Build project', ->
  build()

task 'test', 'Run tests', ->
  build -> test()

build = (callback) ->
  builder = (args...) ->
    (callback) ->
      coffee = spawn 'coffee', args
      coffee.stderr.on 'data', (data) -> process.stderr.write data.toString()
      coffee.stdout.on 'data', (data) -> print data.toString()
      coffee.on 'exit', (code) -> callback?(code,code)
  async.parallel [
    builder('-c', '-o', 'test/lib', 'test/src')
  ], (err, results) -> callback?() unless err

test = ->
  tester = (file) ->
    (callback) ->
      mocha = spawn 'mocha',  ['-u', 'bdd', '-R', 'spec', '-t', '20000', '--colors', "test/lib/#{file}"]
      mocha.stdout.pipe process.stdout, end: false
      mocha.stderr.pipe process.stderr, end: false
      mocha.on 'exit', (code) -> callback?(code,code)
  testFiles = ['mocha-phantomjs.js']
  testers = (tester file for file in testFiles)
  async.series testers, (err, results) -> 
    passed = results.every (code) -> code is 0
    process.exit if passed then 0 else 1



