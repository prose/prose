class app.views.Start extends app.views.Profile

  id: "start"
  
  events:
    "submit #login_form": "_login"

  _login: ->
    self = this
    user = self.$("#github_user").val()
    password = self.$("#github_password").val()
    login
      username: user
      password: password
    , (err) ->
      return self.$(".bad-credentials").show() if err
      window.location.reload()

    false

  render: ->
    $(@el).html app.templates.start(@model)
    $("#header").hide()  unless window.authenticated
    this