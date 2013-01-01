class app.views.Post extends Backbone.View
  
  id: "post"
  
  events:
    "click .save": "_save"
    "click .cancel-save": "_toggleCommit"
    "click .save.confirm": "updateFile"
    "click a.toggle.view": "_toggleView"
    "click a.toggle.meta": "_toggleMeta"
    "change input": "_makeDirty"
    "change #post_published": "updateMetaData"
    "click .delete": "_delete"
    "click .toggle-options": "_toggleOptions"

  _toggleOptions: ->
    $(".options").toggle()
    false

  _delete: ->
    if confirm("Are you sure you want to delete that file?")
      deletePost app.state.user, app.state.repo, app.state.branch, @model.path, @model.file, _.bind((err) ->
        return alert("Error during deletion. Please wait 30 seconds and try again.")  if err
        router.navigate [app.state.user, app.state.repo, "tree", app.state.branch].join("/"), true
      , this)
    false

  updateURL: ->
    url = _.compact([app.state.user, app.state.repo, (if @model.preview then "blob" else "edit"), app.state.branch, @model.path, @model.file])
    router.navigate url.join("/"), false

  _makeDirty: (e) ->
    @dirty = true
    @model.content = @editor.getValue()  if @editor
    @model.raw_metadata = @metadataEditor.getValue()  if @metadataEditor
    unless @$(".button.save").hasClass("saving")
      @$(".button.save").html (if @model.writeable then "SAVE" else "SUBMIT CHANGE")
      @$(".button.save").removeClass "inactive error"

  showDiff: ->
    text1 = @prevContent
    text2 = @serialize()
    d = @dmp.diff_main(text1, text2)
    @dmp.diff_cleanupSemantic d
    diff = @dmp.diff_prettyHtml(d).replace(/&para;/g, "")
    $(".diff-wrapper .diff").html diff

  _toggleCommit: ->
    @$(".commit-message").attr "placeholder", "Updated " + $("input.filepath").val()  unless @$(".document-menu").hasClass("commit")
    @hideMeta()
    @$(".button.save").html (if @$(".document-menu").hasClass("commit") then ((if @model.writeable then "SAVE" else "SUBMIT CHANGE")) else "COMMIT")
    @$(".button.save").toggleClass "confirm"
    @$(".document-menu").toggleClass "commit"
    @$(".button.cancel-save").toggle()
    @$(".document-menu-content .options").hide()
    @showDiff()
    @$(".surface").toggle()
    @$(".diff-wrapper").toggle()
    @$(".commit-message").focus()
    false

  _save: (e) ->
    return false  unless @dirty
    @_toggleCommit()
    e.preventDefault()
    false

  _toggleView: (e) ->
    that = this
    @toggleView $(e.currentTarget).attr("data-view")
    _.delay (->
      that.refreshCodeMirror()
    ), 1
    false

  _toggleMeta: (e) ->
    that = this
    e.preventDefault()  if e
    $(".toggle.meta").toggleClass "active"
    $(".metadata").toggle()
    _.delay (->
      that.refreshCodeMirror()
    ), 1
    false

  refreshCodeMirror: ->
    if $(".toggle.meta").hasClass("active")
      $(".CodeMirror-scroll").height $(".document").height() / 2
    else
      $(".CodeMirror-scroll").height $(".document").height()
    @editor.refresh()
    @metadataEditor.refresh()  if @metadataEditor

  toggleView: (view) ->
    @view = view
    if view is "preview"
      @model.preview = true
      @$(".post-content").html marked(@model.content)
    else
      @model.preview = false
    @hideMeta()
    @updateURL()
    $(".toggle").removeClass "active"
    $(".toggle." + view).addClass "active"
    $(".document .surface").removeClass "preview cheatsheet compose"
    $(".document .surface").addClass view

  hideMeta: ->
    $(".toggle.meta").removeClass "active"
    $(".metadata").hide()

  right: ->
    view = $(".toggle.active").attr("data-view")
    return  if view is "preview"
    return @toggleView("preview")  if view is "compose"
    @toggleView "compose"

  left: ->
    view = $(".toggle.active").attr("data-view")
    return  if view is "cheatsheet"
    return @toggleView("cheatsheet")  if view is "compose"
    @toggleView "compose"

  initialize: ->
    @dmp = new diff_match_patch()
    @mode = "edit"
    @prevContent = @serialize()
    unless window.shortcutsRegistered
      key "⌘+s, ctrl+s", _.bind(->
        @updateFile()
        false
      , this)
      key "ctrl+shift+right", _.bind(->
        @right()
        false
      , this)
      key "ctrl+shift+left", _.bind(->
        @left()
        false
      , this)
      key "esc", _.bind(->
        @toggleView "compose"
        false
      , this)
      window.shortcutsRegistered = true

  parseMetadata: (metadata) ->
    metadata = @metadataEditor.getValue()
    return {}  unless metadata
    try
      return jsyaml.load(metadata)
    catch err
      return null

  updateMetaData: ->
    updatePublished = (yamlStr, published) ->
      regex = /published: (false|true)/
      if yamlStr.match(regex)
        yamlStr.replace regex, "published: " + !!published
      else
        yamlStr + "\npublished: " + !!published
    return true  unless @model.jekyll
    @model.raw_metadata = @metadataEditor.getValue()
    published = @$("#post_published").prop("checked")
    @model.raw_metadata = updatePublished(@model.raw_metadata, published)
    @metadataEditor.setValue @model.raw_metadata
    (if published then $("#post").addClass("published") else $("#post").removeClass("published"))
    true

  updateFilename: (filepath, cb) ->
    finish = ->
      that.model.path = app.state.path
      that.model.file = app.state.file
      app.instance.header.render()
      that.updateURL()
    that = this
    return cb("error")  unless _.validPathname(filepath)
    app.state.path = @model.path
    app.state.file = _.extractFilename(filepath)[1]
    app.state.path = _.extractFilename(filepath)[0]
    if @model.persisted
      movePost app.state.user, app.state.repo, app.state.branch, _.filepath(@model.path, @model.file), filepath, _.bind((err) ->
        finish()  unless err
        (if err then cb("error") else cb(null))
      , this)
    else
      finish()
      cb null

  serialize: ->
    serialize @model.content, (if @model.jekyll then @model.raw_metadata else null)

  updateSaveState: (label, classes) ->
    $(".button.save").html(label).removeClass("inactive error saving").addClass classes

  sendPatch: (filepath, filename, filecontent, message) ->
    patch = ->
      if that.updateMetaData()
        that.model.content = that.prevContent
        that.editor.setValue that.prevContent
        patchFile app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, (err) ->
          if err
            _.delay (->
              that.$(".button.save").html "SUBMIT CHANGE"
              that.$(".button.save").removeClass "error"
              that.$(".button.save").addClass "inactive"
            ), 3000
            that.updateSaveState "! Try again in 30 seconds", "error"
            return
          that.dirty = false
          that.model.persisted = true
          that.model.file = filename
          that.updateURL()
          that.prevContent = filecontent
          that.updateSaveState "CHANGE SUBMITTED", "inactive"

      else
        that.updateSaveState "! Metadata", "error"
    that = this
    that.updateSaveState "SUBMITTING CHANGE ...", "inactive saving"
    patch()
    false

  saveFile: (filepath, filename, filecontent, message) ->
    save = ->
      if that.updateMetaData()
        saveFile app.state.user, app.state.repo, app.state.branch, filepath, filecontent, message, (err) ->
          if err
            _.delay (->
              that._makeDirty()
            ), 3000
            that.updateSaveState "! Try again in 30 seconds", "error"
            return
          that.dirty = false
          that.model.persisted = true
          that.model.file = filename
          that.updateURL()
          that.prevContent = filecontent
          that.updateSaveState "SAVED", "inactive"

      else
        that.updateSaveState "! Metadata", "error"
    that = this
    that.updateSaveState "SAVING ...", "inactive saving"
    return save()  if filepath is _.filepath(@model.path, @model.file)
    @updateFilename filepath, (err) ->
      (if err then that.updateSaveState("! Filename", "error") else save())


  updateFile: ->
    that = this
    filepath = $("input.filepath").val()
    filename = _.extractFilename(filepath)[1]
    filecontent = @serialize()
    message = @$(".commit-message").val() or @$(".commit-message").attr("placeholder")
    method = (if @model.writeable then @saveFile else @sendPatch)
    @model.content = @editor.getValue()
    method.call this, filepath, filename, filecontent, message

  keyMap: ->
    that = this
    "Shift-Ctrl-Left": (codemirror) ->
      that.left()

    "Shift-Ctrl-Right": (codemirror) ->
      that.right()

    "Shift-Ctrl-M": (codemirror) ->
      that._toggleMeta()

    "Ctrl-S": (codemirror) ->
      that.updateFile()

  initEditor: ->
    that = this
    setTimeout (->
      if that.model.jekyll
        that.metadataEditor = CodeMirror($("#raw_metadata")[0],
          mode: "yaml"
          value: that.model.raw_metadata
          theme: "prose-dark"
          lineWrapping: true
          lineNumbers: true
          extraKeys: that.keyMap()
          onChange: _.bind(that._makeDirty, that)
        )
        $("#post .metadata").hide()
      that.editor = CodeMirror($("#code")[0],
        mode: that.model.lang
        value: that.model.content
        lineWrapping: true
        lineNumbers: true
        extraKeys: that.keyMap()
        matchBrackets: true
        theme: "prose-bright"
        onChange: _.bind(that._makeDirty, that)
      )
      that.refreshCodeMirror()
    ), 100

  render: ->
    that = this
    $(@el).html templates.post(_.extend(@model,
      mode: @mode
    ))
    $(@el).addClass "published"  if @model.published
    @initEditor()
    this