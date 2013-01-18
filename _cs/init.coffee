loadApplication (err, data) ->

  window.app.instance = new app.views.Application( model: data ).render()
  
  if (err)
    return app.instance.notify 'error', 'Error while loading data from Github. This might be a temporary issue. Please try again later.'
  
  window.router = new app.routers.Application()
  Backbone.history.start()

  #Cross browser confirmation prior to navigation
  $(window).unload app.instance.confirmExit
  $(window).on 'beforeunload', app.instance.confirmExit
