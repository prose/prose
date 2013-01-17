
# The Router
# ---------------

# Using this.route, because order matters

# #example-user/example-repo

# #example-user
# #example-organization

class app.routers.Application extends Backbone.Router

  initialize: ->
    @route /(.*\/.*)/, "path", @path
    @route ":user", "user", @profile
    @route ":user/:repo", "repo", @repo
    @route "", "start", @start

  start: ->

    return unless confirmExit()

    app.state =
      user: ""
      repo: ""
      mode: ""
      branch: ""
      path: ""

    if app.config.rootUrl?
      @navigate app.config.rootUrl, true
    else
      app.instance.start()

  extractURL: (url) ->
    url = url.split("/")
    app.state =
      user: url[0]
      repo: url[1]
      mode: url[2]
      branch: url[3]
      path: (url.slice(4) or []).join("/")

    app.state

  path: (url) ->
    url = @extractURL(url)
    if url.mode is "tree"
      app.instance.posts url.user, url.repo, url.branch, url.path
    else if url.mode is "new"
      app.instance.newPost url.user, url.repo, url.branch, url.path
    else
      parts = _.extractFilename(url.path)
      app.state.file = parts[1]
      app.instance.post url.user, url.repo, url.branch, parts[0], parts[1], url.mode

  repo: (username, reponame) ->
    app.state =
      user: username
      repo: reponame
      mode: "tree"
      branch: ""
      path: ""

    app.instance.posts username, reponame

  profile: (username) ->

    return unless confirmExit()

    app.state =
      user: username
      repo: ""
      mode: ""
      branch: ""
      path: ""

    app.instance.profile username
