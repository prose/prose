
# Creates human readable versions of _posts/paths
# for "'+searchstr+'"'; // within "'+app.state.path+'/*"';
# within "'+ (app.state.path ? app.state.path : '/') +'"';
class app.views.Posts extends Backbone.View

  events:
    "click a.link": "_loading"
    "keyup #search_str": "_search"
    "click a.switch-branch": "_toggleBranchSelection"

  _toggleBranchSelection: ->
    @$(".branch-wrapper .branches").toggle()
    false

  initialize: (options) ->
      
  _search: ->
    _.delay _.bind(->
      searchstr = @$("#search_str").val()
      @model = getFiles(@model.tree, app.state.path, searchstr)
      @renderResults()
    , this), 10

  _loading: (e) ->
    $(e.currentTarget).addClass "loading"

  semantifyPaths: (paths) ->
    _.map paths, (path) ->
      path: path
      name: path

  renderResults: ->
    @$("#files").html app.templates.files(_.extend(@model, app.state,
      current_path: app.state.path
    ))
    caption = @model.files.length + ""
    searchstr = @$("#search_str").val()
    if searchstr
      caption += " matches"
    else
      caption += " files"
    @$(".results").html caption

  render: ->
    that = this
    @$el.html app.templates.posts(_.extend(@model, app.state,
      current_path: app.state.path
    ))
    _.delay (->
      that.renderResults()
      $("#search_str").focus()
    ), 1
    this