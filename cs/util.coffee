# Run an array of functions in serial
# -------
_.serial = ->
  (_(arguments_).reduceRight(_.wrap, ->
  ))()


# Parent path
# -------
_.parentPath = (path) ->
  path.replace /\/?[a-zA-Z0-9_-]*$/, ""


# Topmost path
# -------
_.topPath = (path) ->
  match = path.match(/\/?([a-zA-Z0-9_-]*)$/)
  match[1]


# Valid filename check
# -------
_.validFilename = (filename) ->
  !!filename.match(/^([a-zA-Z0-9_-]|\.)+$/)


# Disabled for now: the Jekyll post format layout
# return !!filename.match(/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9_-]+\.md$/);

# Valid pathname check
# -------
_.validPathname = (path) ->
  _.all path.split("/"), (filename) ->
    _.validFilename filename



# Extract filename from a given path
# -------
# 
# _.extractFilename('path/to/foo.md')
# => ['path/to', 'foo.md']
_.extractFilename = (path) ->
  return ["", path]  unless path.match(/\//)
  matches = path.match(/(.*)\/(.*)$/)
  [matches[1], matches[2]]


# Determine mode for CodeMirror
# -------
_.mode = (file) ->
  return "gfm"  if _.markdown(file)
  extension = _.extension(file)
  switch extension
    when "js", "json" then return "javascript"
    when "html" then return "htmlmixed"
    when "rb" then return "ruby"
    when "yml" then return "yaml"
    when "clj" then return "clojure"
    when "coffee", "cake" then return "coffeescript"
    when "java", "c", "cpp", "cs", "php" then return "clike"
  return extension

# Check if a given file is a Jekyll post
# -------
_.jekyll = (path, file) ->
  !!(path.match("_posts") and _.markdown(file))


# check if a given file has YAML frontmater
# -------
_.hasMetadata = (content) ->
  content.match /^(---\n)((.|\n)*?)\n---\n?/


# Extract file extension
# -------
_.extension = (file) ->
  match = file.match(/\.(\w+)$/)
  (if match then match[1] else null)


# Determines whether a given file is a markdown file or not
# -------
_.markdown = (file) ->
  regex = new RegExp(".(md|mkdn?|mdown|markdown)$")
  !!(regex.test(file))


# Clip a string
# -------
_.clip = (str, length) ->
  res = str.substr(0, length)
  res += " ..."  if length < str.length
  res


# Concatenate path + file to full filepath
# -------
_.filepath = (path, file) ->
  ((if path then path + "/" else "")) + file


# Converts a javascript object to YAML
# Does not support nested objects
# Multiline values are serialized as Blocks
_.toYAML = (metadata) ->
  res = []
  _.each metadata, (value, property) ->
    if value.match(/\n/)
      str = property + ": |\n"
      _.each value.split("\n"), (line) ->
        str += "  " + line

      res.push()
    else
      res.push property + ": " + value

  res.join "\n"


# Only parses first level of YAML file
# Considers the whole thing as a key-value pair party
# 
# name: "michael"
# age: 25
# friends:
# - Michael
# - John
# block: |
#   Hello World
#   Another line
#   24123 
# 
# =>
# {
#   name: 'michael',
#   age: "25",
#   friends: "- Michael\n- John",
#   block: "Hello World\nAnother line\n24123"
# }
# 
# var yaml = 'name:     "michael"\nage: 25\nfriends:\n- Michael\n- John\nblock: |\n  hey ho\n  some text\n  yay';
# console.log(_.fromYAML(yaml));
_.fromYAML = (rawYAML) ->
  add = ->
    data[key] = (if _.isArray(value) then value.join("\n") else value)
    key = null
    value = ""
  data = {}
  lines = rawYAML.split("\n")
  key = null
  value = ""
  blockValue = false
  _.each lines, (line) ->
    match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/)
    add()  if match and key
    if match # New Top Level key found
      key = match[1]
      value = match[2]
      if value.match(/\|$/)
        blockValue = true
        value = ""
    
    # console.log(key, value);
    else
      value = []  unless _.isArray(value)
      if blockValue
        value.push line.trim()
      else
        value.push line.replace(/^\s\s/, "")

  add()
  data


# Chunked Path
# -------
# 
# _.chunkedPath('path/to/foo')
# =>
# [
#   { url: 'path',        name: 'path' },
#   { url: 'path/to',     name: 'to' },
#   { url: 'path/to/foo', name: 'foo' }
# ]
_.chunkedPath = (path) ->
  chunks = path.split("/")
  _.map chunks, (chunk, index) ->
    url = []
    i = 0

    while i <= index
      url.push chunks[i]
      i++
    url: url.join("/")
    name: chunk
