return if not authenticate()

loadApplication (err, data) ->

  window.app.instance = new app.views.Application({ el: '#container', model: data }).render();
 
  if (err) 
    return app.instance.notify 'error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.'

  window.router = new app.routers.Application()
  Backbone.history.start()

confirmExit = ->
  return true unless window.app.instance.mainView and window.app.instance.mainView.dirty
  confirm "You have unsaved changes. Are you sure you want to leave?"
  
# Prevent exit when there are unsaved changes
window.onbeforeunload = confirmExit