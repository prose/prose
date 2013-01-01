# Gimme a Github object! Please.
github = ->
  new Github(
    token: $.cookie("oauth-token")
    username: $.cookie("username")
    auth: "oauth"
  )

# Return a random string
# -------
randomString = ->
  chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
  string_length = 8
  randomstring = ""
  i = 0

  while i < string_length
    rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
    i++
  randomstring

# Smart caching (needed for managing subsequent updates)
# -------
getRepo = (user, repo) ->
  return app.currentRepo.instance if app.currentRepo.user is user and app.currentRepo.repo is repo # Cached
  currentRepo =
    user: user
    repo: repo
    instance: github().getRepo(user, repo)

  currentRepo.instance

# Authentication
# -------
authenticate = ->
  return window.authenticated = true  if $.cookie("oauth-token")
  match = window.location.href.match(/\?code=([a-z0-9]*)/)
  
  # Handle Code
  if match
    $.getJSON "{{site.gatekeeper_url}}/authenticate/" + match[1], (data) ->
      $.cookie "oauth-token", data.token
      window.authenticated = true
      
      # Adjust URL
      regex = new RegExp("\\?code=" + match[1])
      window.location.href = window.location.href.replace(regex, "").replace("&state=", "")

    false
  else
    true
logout = ->
  window.authenticated = false
  $.cookie "oauth-token", null

# Load Application
# -------
# 
# Load everything that's needed for the app + header
loadApplication = (cb) ->
  if window.authenticated
    $.ajax
      type: "GET"
      url: "https://api.github.com/user"
      dataType: "json"
      contentType: "application/x-www-form-urlencoded"
      headers:
        Authorization: "token " + $.cookie("oauth-token")

      success: (res) ->
        $.cookie "avatar", res.avatar_url
        $.cookie "username", res.login
        app.username = res.login
        user = github().getUser()
        owners = {}
        user.repos (err, repos) ->
          user.orgs (err, orgs) ->
            _.each repos, (r) ->
              owners[r.owner.login] = (if owners[r.owner.login] then owners[r.owner.login].concat([r]) else [r])

            cb null,
              available_repos: repos
              organizations: orgs
              owners: owners




      error: (err) ->
        cb "error",
          available_repos: []
          owners: {}


  else
    cb null,
      available_repos: []
      owners: {}


# Load Repos
# -------
# 
# List all available repositories for a certain user
loadRepos = (username, cb) ->
  user = github().getUser()
  user.show username, (err, u) ->
    owners = {}
    if u.type.toLowerCase() is "user"
      user.userRepos username, (err, repos) ->
        cb null,
          repos: repos
          user: u


    else
      user.orgRepos username, (err, repos) ->
        cb null,
          repos: repos
          user: u




# Load Branches
# -------
# 
# List all available branches of a repository
loadBranches = (user, repo, cb) ->
  repo = getRepo(user, repo)
  repo.listBranches (err, branches) ->
    cb err, branches


# Get files from a tree based on a given path and searchstr
# -------
getFiles = (tree, path, searchstr) ->
  matchesPath = (file) ->
    return false  if file.path is path # skip current path
    match = file.path.match(new RegExp("^" + path + "(.*)$"))
    return !!searchstr or match[1].split("/").length <= ((if path then 2 else 1))  if match
    false
  matchesSearch = (file) ->
    return true  unless searchstr
    
    # Insert crazy search pattern match algorithm
    file.path.toLowerCase().search(searchstr.toLowerCase()) >= 0
  pathMatches = 0
  
  # Filter
  files = _.filter(tree, (file) ->
    matchSearch = new RegExp("(" + searchstr + ")", "i")
    
    # Depending on search use full path or filename
    file.name = (if searchstr then file.path else _.extractFilename(file.path)[1])
    
    # Scope name to current path
    file.name = file.name.replace(new RegExp("^" + path + "/?"), "")
    
    # Mark match
    file.name = file.name.replace(matchSearch, "<b>$1</b>")
    return false  unless matchesPath(file)
    pathMatches += 1
    matchesSearch file
  )
  
  # Sort by name
  files = _.sortBy(files, (entry) ->
    ((if entry.type is "tree" then "A" else "B")) + entry.path
  )
  tree: tree
  files: files
  total: pathMatches

# Load Posts
# -------
# 
# List all postings for a given repo+branch+path plus load _config.yml
loadPosts = (user, reponame, branch, path, cb) ->
  loadConfig = (cb) ->
    repo.read branch, "_config.yml", (err, data) ->
      return cb(err)  if err
      cb null, jsyaml.load(data)

  load = (repodata) ->
    loadConfig (err, config) ->
      app.state.jekyll = not err
      app.state.config = config
      root = (if config and config.prose and config.prose.rooturl then config.prose.rooturl else "")
      path = root  unless path
      repo.getTree branch + "?recursive=true", (err, tree) ->
        return cb("Not found")  if err
        loadBranches user, reponame, (err, branches) ->
          return cb("Branches couldn't be fetched")  if err
          app.state.path = (if path then path else "")
          app.state.branches = _.filter(branches, (b) ->
            b isnt branch
          )
          cb null, getFiles(tree, path, "")


  repo = getRepo(user, reponame)
  repo.show (err, repodata) ->
    app.state.branch = branch = repodata.master_branch  unless branch
    app.state.permissions = repodata.permissions
    load()


# Serialize
# -------
serialize = (content, metadata) ->
  if metadata
    ["---", metadata, "---"].join("\n") + "\n\n" + content
  else
    content

# Save File
# -------
# 
# Store a file to GitHub
saveFile = (user, repo, branch, path, content, message, cb) ->
  repo = getRepo(user, repo)
  repo.write branch, path, content, message, cb

# Fork repository
# -------
# 
# Creates a fork for the current user
forkRepo = (user, reponame, branch, cb) ->
  
  # Wait until contents are ready.
  onceReady = (cb) ->
    _.delay (->
      forkedRepo.contents "", (err, contents) ->
        (if contents then cb() else onceReady(cb))

    ), 500
  repo = getRepo(user, reponame)
  forkedRepo = getRepo(app.username, reponame)
  repo.fork (err) ->
    onceReady ->
      repo.getRef "heads/" + branch, (err, commitSha) ->
        
        # Create temp branch
        forkedRepo.listBranches (unused, branches) ->
          
          #find the lowest patch number
          i = 1
          i++  until $.inArray("prose-patch-" + i, branches) is -1
          refSpec =
            ref: "refs/heads/prose-patch-" + i
            sha: commitSha

          forkedRepo.createRef refSpec, cb





# New pull request
# -------
# 
# Creates a new pull request
createPullRequest = (user, repo, pull, cb) ->
  repo = getRepo(user, repo)
  repo.createPullRequest pull, (err) ->
    cb()


# Patch File
# -------
# 
# Send a pull request on GitHub
patchFile = (user, repo, branch, path, content, message, cb) ->
  forkRepo user, repo, branch, (err, info) ->
    branch = info.ref.substring(info.ref.lastIndexOf("/") + 1)
    saveFile app.username, repo, branch, path, content, message, (err) ->
      return cb(err)  if err
      pull =
        title: message
        body: "This pull request has been automatically generated by Prose.io."
        base: app.state.branch
        head: app.username + ":" + branch

      createPullRequest app.state.user, app.state.repo, pull, cb



# Delete Post
# -------
deletePost = (user, repo, branch, path, file, cb) ->
  repo = getRepo(user, repo)
  repo.remove branch, _.filepath(path, file), cb

# Move Post
# -------
movePost = (user, repo, branch, path, newPath, cb) ->
  repo = getRepo(user, repo)
  repo.move branch, path, newPath, cb

# New Post
# -------
# 
# Prepare new empty post
emptyPost = (user, repo, branch, path, cb) ->
  rawMetadata = "layout: default\npublished: false"
  metadata =
    layout: "default"
    published: false

  cfg = app.state.config
  if cfg and cfg.prose and cfg.prose.metadata
    if cfg.prose.metadata[path]
      rawMetadata = cfg.prose.metadata[path]
      try
        metadata = jsyaml.load(rawMetadata)
      catch err
        console.log "ERROR encoding YAML"
  
  # No-op
  cb null,
    metadata: metadata
    raw_metadata: rawMetadata
    content: "# How does it work?\n\nEnter Text in Markdown format."
    repo: repo
    path: path
    published: false
    persisted: false
    writeable: true
    file: new Date().format("Y-m-d") + "-your-filename.md"


# Load Post
# -------
# 
# List all postings for a given repository
# Looks into _posts/blog
loadPost = (user, repo, branch, path, file, cb) ->
  repo = getRepo(user, repo)
  repo.read branch, (if path then path + "/" + file else file), (err, data, commit) ->
    
    # Given a YAML front matter, determines published or not
    published = (metadata) ->
      !!metadata.match(/published: true/)
    
    # Extract YAML from a post, trims whitespace
    parse = (content) ->
      # normalize a little bit
      writeable = ->
        !!(app.state.permissions and app.state.permissions.push)
      content = content.replace(/\r\n/g, "\n")
      unless _.hasMetadata(content)
        return (
          raw_metadata: ""
          content: content
          published: false
          writeable: writeable()
        )
      res =
        raw_metadata: ""
        published: false
        writeable: writeable()

      res.content = content.replace(/^(---\n)((.|\n)*?)\n---\n?/, (match, dashes, frontmatter) ->
        res.raw_metadata = frontmatter
        res.published = published(frontmatter)
        ""
      ).trim()
      res
    return cb(err)  if err
    post = parse(data)
    cb err, _.extend(post,
      sha: commit
      markdown: _.markdown(file)
      jekyll: _.hasMetadata(data)
      repo: repo
      path: path
      file: file
      persisted: true
    )

app.currentRepo =
  user: null
  repo: null
  instance: null