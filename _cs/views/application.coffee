class app.views.Application extends Backbone.View
  
  el: "#container"

  events:
    "click .toggle-view": "toggleView"

  toggleView: (e) ->
    e.preventDefault()
    e.stopPropagation()
    link = $(e.currentTarget)
    route = link.attr("href").replace(/^\//, "")
    $(".toggle-view.active").removeClass "active"
    link.addClass "active"
    router.navigate route, true

  initialize: ->
    calculateLayout = ->
      that.mainView.refreshCodeMirror() if that.mainView and that.mainView.refreshCodeMirror
    _.bindAll this
    that = this
    @header = new app.views.Header(model: @model)
    lazyLayout = _.debounce(calculateLayout, 300)
    $(window).resize lazyLayout
    
  render: ->
    $(@header.render().el).prependTo @el
    @

  replaceMainView: (name, view) ->
    $("body").removeClass().addClass "current-view " + name
    $("#header").show()  if name isnt "start"
    if @mainView
      @mainView.remove()
    else
      $("#main").empty()
    @mainView = view
    $(view.el).appendTo jQuery("#main")

  static: ->
    @header.render()

  posts: (user, repo, branch, path) ->
    @loading "Loading posts ..."
    loadPosts user, repo, branch, path, _.bind((err, data) ->
      @loaded()
      return @notify("error", "The requested resource could not be found.")  if err
      @header.render()
      @replaceMainView "posts", new app.views.Posts(
        model: data
        id: "posts"
      ).render()
    , this)

  post: (user, repo, branch, path, file, mode) ->
    @loading "Loading post ..."
    loadPosts user, repo, branch, path, _.bind((err, data) ->
      return @notify("error", "The requested resource could not be found.")  if err
      loadPost user, repo, branch, path, file, _.bind((err, data) ->
        @loaded()
        @header.render()
        return @notify("error", "The requested resource could not be found.")  if err
        data.preview = (mode isnt "edit")
        data.lang = _.mode(file)
        @replaceMainView (if window.authenticated then "post" else "read-post"), new app.views.Post(
          model: data
          id: "post"
        ).render()
        that = this
      , this)
      @header.render()
    , this)

  newPost: (user, repo, branch, path) ->
    @loading "Creating file ..."
    loadPosts user, repo, branch, path, _.bind((err, data) ->
      emptyPost user, repo, branch, path, _.bind((err, data) ->
        @loaded()
        data.jekyll = _.jekyll(path, data.file)
        data.preview = false
        data.markdown = _.markdown(data.file)
        @replaceMainView "post", new app.views.Post(
          model: data
          id: "post"
        ).render()
        @mainView._makeDirty()
        app.state.file = data.file
        @header.render()
      , this)
    , this)

  profile: (username) ->
    that = this
    app.state.title = username
    @loading "Loading profile ..."
    loadRepos username, (err, data) ->
      that.header.render()
      that.loaded()
      data.authenticated = !!window.authenticated
      that.replaceMainView "start", new app.views.Profile(
        id: "start"
        model: data
      ).render()


  start: (username) ->
    that = this
    app.state.title = ""
    @header.render()
    @replaceMainView "start", new app.views.Start(
      id: "start"
      model: _.extend(@model,
        authenticated: !!window.authenticated
      )
    ).render()

  notify: (type, message) ->
    @header.render()
    @replaceMainView "notification", new app.views.Notification(type, message).render()

  loading: (msg) ->
    $("#main").html "<div class=\"loading\"><span>" + msg or "Loading ..." + "</span></div>"

  loaded: ->
    $("#main .loading").remove()
    
  confirmExit: =>
    return null unless @mainView?
    return null unless @mainView.dirty
    
    "You have unsaved changes. Are you sure you want to leave?"