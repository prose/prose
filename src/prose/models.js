var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var queue = require('queue-async');
var cookie = require('./cookie');
var Github = require('../libs/github');
var queue = require('queue-async');
var oauth = require('../../oauth.json');

// Set up a GitHub object
// -------
window.auth = {
  api: oauth.api || 'https://api.github.com',
  site: oauth.site || 'https://github.com',
  id: oauth.clientId,
  url: oauth.gatekeeperUrl
};

function github() {
  return new Github({
    api: auth.api,
    token: cookie.get('oauth-token'),
    username: cookie.get('username'),
    auth: 'oauth'
  });
}

var currentRepo = {
  user: null,
  repo: null,
  instance: null
};

module.exports = {

  // Smart caching (needed for managing subsequent updates)
  // -------

  getRepo: function(user, repo) {
    if (currentRepo.user === user && currentRepo.repo === repo) {
      return currentRepo.instance; // Cached
    }

    currentRepo = {
      user: user,
      repo: repo,
      instance: github().getRepo(user, repo)
    };

    return currentRepo.instance;
  },

  // Authentication
  // -------

  authenticate: function() {
    if (cookie.get('oauth-token')) return window.authenticated = true;
    var match = window.location.href.match(/\?code=([a-z0-9]*)/);

    // Handle Code
    if (match) {
      $.getJSON(auth.url + '/authenticate/' + match[1], function (data) {
        cookie.set('oauth-token', data.token);
        window.authenticated = true;

        // Adjust URL
        var regex = new RegExp("\\?code=" + match[1]);
        window.location.href = window.location.href.replace(regex, '').replace('&state=', '');
      });
      return false;
    } else {
      return true;
    }
  },

  logout: function() {
    window.authenticated = false;
    cookie.unset('oauth-token');
  },

  // Load Application
  // -------
  //
  // Load everything that's needed for the app + header

  loadApplication: function(cb) {
    if (window.authenticated) {
      $.ajax({
        type: 'GET',
        url: auth.api + '/user',
        dataType: 'json',
        contentType: 'application/x-www-form-urlencoded',
        headers: {
          Authorization: 'token ' + cookie.get('oauth-token')
        },
        success: function (res) {
          cookie.set('avatar', res.avatar_url);
          cookie.set('username', res.login);
          app.username = res.login;
          app.avatar = res.avatar_url;

          var user = github().getUser();
          var owners = {};

          user.repos(function (err, repos) {
            user.orgs(function (err, orgs) {
              _.each(repos, function (r) {
                owners[r.owner.login] = owners[r.owner.login] ? owners[r.owner.login].concat([r]) : [r];
              });

              cb(null, {
                'available_repos': repos,
                'organizations': orgs,
                'owners': owners
              });
            });
          });

        },
        error: function (err) {
          cb('error', {
            'available_repos': [],
            'owners': {}
          });
        }
      });

    } else {
      cb(null, {
        'available_repos': [],
        'owners': {}
      });
    }
  },

  // Create a File
  // -------
  //
  // Fired when uploading images via file selection or
  // drag and drop
  uploadFile: function(username, repo, path, data, cb) {
    var file = github().getFile();
    file.create(username, repo, path, data, function(err, res) {
       if (err) // TODO Handle it
       cb();
    });
  },

  // Load Repos
  // -------
  //
  // List all available repositories for a certain user

  loadRepos: function(username, cb) {
    var user = github().getUser();
    user.show(username, function(err, u) {
      if (err) return router.navigate('error/' + err.error, true);

      // TODO if error, bring up the notification to
      // say, "You need to be a logged in user to do this!"
      // if (err) ...
      var owners = {};
      if (u.type && u.type.toLowerCase() === 'user') {
        user.userRepos(username, function (err, repos) {
          cb(null, {
            'repos': repos,
            user: u
          });
        });
      } else {
        user.orgRepos(username, function (err, repos) {
          cb(null, {
            'repos': repos,
            user: u
          });
        });
      }
    });
  },

  // Load Branches
  // -------
  //
  // List all available branches of a repository

  loadBranches: function(user, repo, cb) {
    repo = this.getRepo(user, repo);

    repo.listBranches(function (err, branches) {
      cb(err, branches);
    });
  },

  // Filter on projects based on a searchstr
  // -------
  filterProjects: function(repos, searchstr) {

    var matchSearch = new RegExp('(' + searchstr + ')', 'i');
    var listings;

    // Dive into repos.owners and pull each match into a new owners array.
    if (repos.user.name === app.username) {

      var owners = {};
      var owner = _(repos.owners).filter(function(ownerRepos, owns) {
        listings = _(ownerRepos).filter(function(r) {

          if (searchstr && searchstr.length) {
            r.name = r.name.replace(matchSearch, '$1');
          }

          if (!searchstr) return true;
          return r.name.toLowerCase().search(searchstr.toLowerCase()) >= 0;
        });

        return owners[owns] = listings;
      });

      return {
        title: repos.user.name,
        owners: owners
      };

    } else {
      listings = _(repos.repos).filter(function(repo) {
        if (searchstr && searchstr.length) {
          repo.name = repo.name.replace(matchSearch, '$1');
        }
        if (!searchstr) return true;
        return repo.name.toLowerCase().search(searchstr.toLowerCase()) >= 0;
      });

      // TODO sort by name eg: listigs = _(listings).sortby( ...
      return {
        repos: listings
      };
    }
  },

  // Get files from a tree based on a given path and searchstr
  // -------

  getFiles: function(tree, path, searchstr) {
    // catch undefined path
    path = path || '';

    var pathMatches = 0;

    function matchesPath(file) {
      if (file.path === path) return false; // skip current path
      var length = path.length;
      // Append trailing slash if path exists and not already present
      if (length && path[length - 1] !== '/') {
        path += '/';
      }
      var match = file.path.match(new RegExp('^' + path + '(.*)$'));
      if (match) {
        return !!searchstr || match[1].split('/').length <= 1;
      }
      return false;
    }

    // Filter
    var files = _(tree).filter(function(file) {
      var matchSearch = new RegExp('(' + searchstr + ')', 'i');

      // Depending on search use full path or filename
      file.name = searchstr ? file.path : _.extractFilename(file.path)[1];

      // Scope name to current path
      file.name = file.name.replace(new RegExp('^' + path + '/?'), '');

      // Mark match if searchstr not empty
      if (searchstr && searchstr.length) {
        file.name = file.name.replace(matchSearch, "<strong>$1</strong>");
      }

      function matchesSearch(file, string) {
        if (!string) return true;
        // Insert crazy search pattern match algorithm
        return file.path.toLowerCase().search(string.toLowerCase()) >= 0;
      }

      if (!matchesPath(file)) return false;
      pathMatches += 1;
      return matchesSearch(file, searchstr);
    });

    // Sort by name
    files = _.sortBy(files, function (entry) {
      return (entry.type === 'tree' ? 'A' : 'B') + entry.path;
    });

    return {
      tree: tree,
      files: files,
      total: pathMatches
    };
  },

  // Load Config
  // -------
  //
  // Load _config.yml or prose.yml

  loadConfig: function(user, reponame, branch, file, cb) {
    if (file) {
      if (reponame === app.state.currentRepo) {
        cb(app.state.config);
      } else {
        var repo = this.getRepo(user, reponame);
        app.state.currentRepo = reponame;
        repo.contents(branch, file, function(err, data) {
          if (err) return cb(err);
          app.state.config = jsyaml.load(data);
          cb(app.state.config, err);
        });
      }
    } else {
      cb(false);
    }
  },

  // Load Posts
  // -------
  //
  // List all postings for a given repo+branch+path
  // plus load _config.yml or prose.yml

  loadPosts: function(user, reponame, branch, path, cb) {
    var models = this;
    var repo = this.getRepo(user, reponame);

    function load(repodata) {
      repo.getTree(branch + '?recursive=true', function(err, tree) {

        // TODO This could be better. It would be great to
        // avoid the callback dependency and order when
        // we refacor models.

        // Check for prose.yml or _config.yml
        var configName = _(tree).find(function(t) {
          if (t.path === 'prose.yml') {
            return t.path;
          } else if (t.path === '_config.yml') {
            return t.path;
          } else {
            return false;
          }
        });

        var file = configName ? configName.path : false;

        models.loadConfig(user, reponame, branch, file, function(config, err) {
          if (err) return cb('Not found');

          var root = config && config.prose && config.prose.rooturl ? config.prose.rooturl : '';
          if (!path) path = root;

          var paths = _.pluck(tree, 'path');

          models.loadBranches(user, reponame, function(err, branches) {
            if (err) return cb('Branches could not be fetched');
            app.state.path = path ? path : '';

            app.state.branches = _.filter(branches, function(b) {
              return b !== branch;
            });

            repo.getSha(branch, app.state.path, function(err, sha) {
              app.state.sha = sha;
            });

            var store = window.sessionStorage;
            var historyStore;
            var history;
            var lastModified;

            if (store) {
              historyStore = store.getItem('history');

              if (historyStore) {
                history = JSON.parse(historyStore);

                if (history && history.user === user && history.repo === reponame && history.branch === branch) {
                  lastModified = history.modified;

                  history.recent[app.username] = _.filter(history.recent[app.username], function(value) {
                    return history.commits[value][0].status === 'removed' ||
                      _.pluck(tree, 'path').indexOf(value) > -1;
                  });

                  app.state.history = history;
                }
              }
            }

            repo.getCommits(branch, lastModified, function(err, commits, xhr) {
              if (err) return cb('Not found');

              if (xhr.status !== 304) {
                var q = queue();

                // build list of recently edited files
                _.each(_.pluck(commits, 'sha'), function(sha) {
                  q.defer(repo.getCommit, sha);
                });

                q.awaitAll(function(err, res) {
                  if (err) return err;

                  var state = {};
                  var recent = {};

                  var commit;
                  var file;
                  var filename;
                  var author;

                  for (var i = 0; i < res.length; i++) {
                    commit = res[i];

                    if (commit.files) {
                      for (var j = 0; j < commit.files.length; j++) {
                        file = commit.files[j];
                        filename = file.filename;

                        var fileCommit = {
                          status: file.status,
                          url: file.contents_url
                        };

                        if (state[filename]) {
                          state[filename].push(fileCommit);
                        } else {
                          state[filename] = [fileCommit];
                        }

                        // some malformed commit data requires this
                        if (commit.author) {
                          author = commit.author.login;

                          if (recent[author]) {
                            recent[author] = _.union(recent[author], filename);
                          } else {
                            recent[author] = [filename];
                          }
                        }
                      }
                    }
                  }

                  recent[app.username] = _.filter(recent[app.username], function(value) {
                    return state[value][0].status === 'removed' ||
                      _.pluck(tree, 'path').indexOf(value) > -1;
                  });

                  var history = app.state.history = {
                    'user': user,
                    'repo': reponame,
                    'branch': branch,
                    'modified': xhr.getResponseHeader('Last-Modified'),
                    'commits': state,
                    'recent': recent,
                    'link': xhr.getResponseHeader('link')
                  };

                  var store = window.sessionStorage;
                  if (store) {
                    try {
                      store.setItem('history', JSON.stringify(history));
                    } catch(err) {
                      console.log(err);
                    }
                  }

                  if (app.state.mode === 'tree') {
                    // TODO: temporary fix, break history sidebar into a discrete view
                    app.eventRegister.trigger('sidebarContext', app.state);
                  }
                });
              }
            });

            cb(null, models.getFiles(tree, path, ''));
          });
        });
      });
    }

    repo.show(function(err, repodata) {
      if (err) return router.navigate('error/' + err.error, true);
      if (!branch) app.state.branch = branch = repodata.master_branch;
      app.state.isPrivate = repodata.private;
      app.state.permissions = repodata.permissions;
      load();
    });
  },

  // Save File
  // -------
  //
  // Store a file to GitHub

  saveFile: function(user, repo, branch, path, content, message, cb) {
    // add newline to eof if not present to make git happy
    if (!content.match(/\n$/)) {
      content = content + '\n';
    }

    repo = this.getRepo(user, repo);
    repo.write(branch, path, content, message, cb);
  },

  // Fork repository
  // -------
  //
  // Creates a fork for the current user

  forkRepo: function(user, reponame, branch, cb) {
    var repo = this.getRepo(user, reponame);
    var forkedRepo = this.getRepo(app.username, reponame);

    // Wait until contents are ready.

    function onceReady(cb) {
      _.delay(function() {
        forkedRepo.contents(branch, '', function(err, contents) {
          if (contents) {
            cb();
          } else {
            onceReady(cb);
          }
        });
      }, 500);
    }

    repo.fork(function (err) {
      onceReady(function () {
        repo.getRef('heads/' + branch, function (err, commitSha) {
          // Create temp branch
          forkedRepo.listBranches(function (unused, branches) {
            //find the lowest patch number
            i = 1;
            while ($.inArray('prose-patch-' + i, branches) != -1) {
              i++;
            }
            var refSpec = {
              'ref': 'refs/heads/prose-patch-' + i,
              'sha': commitSha
            };
            forkedRepo.createRef(refSpec, cb);
          });
        });
      });
    });
  },

  // New pull request
  // -------
  //
  // Creates a new pull request

  createPullRequest: function(user, repo, pull, cb) {
    repo = this.getRepo(user, repo);
    repo.createPullRequest(pull, function(err) {
      if (err) return cb(err);
      cb();
    });
  },

  // Patch File
  // -------
  //
  // Send a pull request on GitHub

  patchFile: function(user, repo, branch, path, content, message, cb) {
    var models = this;
    this.forkRepo(user, repo, branch, function (err, info) {
      branch = info.ref.substring(info.ref.lastIndexOf('/') + 1);
      models.saveFile(app.username, repo, branch, path, content, message, function (err) {
        if (err) return cb(err);
        var pull = {
          title: message,
          body: 'This pull request has been automatically generated by prose.io.',
          base: app.state.branch,
          head: app.username + ':' + branch
        };
        models.createPullRequest(app.state.user, app.state.repo, pull, cb);
      });
    });
  },

  // Delete Post
  // -------

  deletePost: function(user, repo, branch, path, file, cb) {
    repo = this.getRepo(user, repo);
    repo.remove(branch, _.filepath(path, file), cb);
  },

  // Move Post
  // -------

  movePost: function(user, repo, branch, path, newPath, cb) {
    repo = this.getRepo(user, repo);
    repo.move(branch, path, newPath, cb);
  },

  // New Post
  // -------
  //
  // Prepare new empty post

  emptyPost: function(user, repo, branch, path, cb) {
    var file = new Date().format('Y-m-d') + '-your-filename.md';
    var rawMetadata = 'layout: default\npublished: false';
    var defaultMetadata;
    var metadata = {
      'layout': 'default',
      'published': false
    };

    // load default metadata
    var cfg = app.state.config;
    var q = queue();

    if (cfg && cfg.prose && cfg.prose.metadata) {
      // match nearest parent directory default metadata
      var nearestPath = path;
      var nearestDir = /\/(?!.*\/).*$/;
      while (cfg.prose.metadata[nearestPath] === undefined && nearestPath.match( nearestDir )) {
        nearestPath = nearestPath.replace( nearestDir, '' );
      }

      if (cfg.prose.metadata[nearestPath]) {
        defaultMetadata = cfg.prose.metadata[nearestPath];

        if (typeof defaultMetadata === 'object') {
          _.each(defaultMetadata, function(data, key) {
            if (data && data.field) {
              if (typeof data.field.options === 'string' && data.field.options.match(/^https?:\/\//)) {

                q.defer(function(cb){
                  $.ajax({
                    cache: true,
                    dataType: 'jsonp',
                    jsonp: false,
                    jsonpCallback: data.field.options.split('?callback=')[1] || 'callback',
                    url: data.field.options,
                    success: function(d) {
                      data.field.options = d;
                      cb();
                    }
                  });
                });
              }

              switch(data.field.element) {
                case 'boolean':
                case 'text':
                  metadata[data.name] = data.field.value;
                  break;
                case 'select':
                case 'multiselect':
                  metadata[data.name] = data.field.selected ? data.field.selected : null;
                  break;
              }
            } else {
              metadata[key] = data;
            }
          });

          rawMetadata = jsyaml.dump(metadata);
        } else if (typeof defaultMetadata === 'string') {
          rawMetadata = defaultMetadata;

          try {
            defaultMetadata = jsyaml.load(rawMetadata);

            _.each(defaultMetadata, function(data, key) {
              metadata[key] = data;
            });

            if (metadata.date === 'CURRENT_DATETIME') {
              var current = (new Date()).format('Y-m-d H:i');
              metadata.date = current;
              rawMetadata = rawMetadata.replace('CURRENT_DATETIME', current);
            }
          } catch(err) {
            console.log('ERROR encoding YAML');
            // No-op
          }
        }
      }
    }

    q.await(function() {

      // If ?file= in path, use it as file name
      if (path.indexOf('?file=') !== -1) {
        file = path.split('?file=')[1];
        path = path.split('?file=')[0].replace(/\/$/, '');
      }
      cb(null, {
        'metadata': metadata,
        'default_metadata': defaultMetadata,
        'content': '## A New Post\n\nEnter text in [Markdown](http://daringfireball.net/projects/markdown/). Use the toolbar above, or click the **?** button for formatting help.',
        'repo': repo,
        'path': path,
        'published': false,
        'persisted': false,
        'writeable': true,
        'file': file
      });
    });
  },

  // breaks the err first pattern because of use by _.partial
  _loadPostData: function(repo, path, file, cb, err, data, xhr) {
    if (err) return cb(err);

    function published(metadata) {
      // Given a YAML front matter, determines published or not
      // default to published unless explicitly set to false
      return !metadata.match(/published: false/);
    }

    function parse(content) {
      // Extract YAML from a post, trims whitespace
      content = content.replace(/\r\n/g, '\n'); // normalize a little bit

      function writeable() {
        return !!(app.state.permissions && app.state.permissions.push);
      }

      var hasMetadata = !!_.hasMetadata(content);

      if (!hasMetadata) return {
        content: content,
        published: true,
        writeable: writeable(),
        jekyll: hasMetadata
      };

      var res = {
        writeable: writeable(),
        jekyll: hasMetadata
      };

      res.content = content.replace(/^(---\n)((.|\n)*?)\n---\n?/, function (match, dashes, frontmatter) {
        try {
          res.metadata = jsyaml.load(frontmatter);
          res.metadata.published = published(frontmatter);
        } catch(err) {
          console.log('ERROR encoding YAML');
        }

        return '';
      }).trim();

      return res;
    }

    var post = parse(data);
    var rawMetadata;
    var defaultMetadata;

    // load default metadata
    var cfg = app.state.config;
    var q = queue();

    if (cfg && cfg.prose && cfg.prose.metadata) {
      // match nearest parent directory default metadata
      var nearestPath = path;
      var nearestDir = /\/(?!.*\/).*$/;
      while (cfg.prose.metadata[nearestPath] === undefined && nearestPath.match( nearestDir )) {
        nearestPath = nearestPath.replace( nearestDir, '' );
      }

      if (cfg.prose.metadata[nearestPath]) {
        defaultMetadata = cfg.prose.metadata[nearestPath];
        if (typeof defaultMetadata === 'object') {
          _(defaultMetadata).each(function(value) {
            if (value.field && value.field.options &&
                typeof value.field.options === 'string' &&
                value.field.options.match(/^https?:\/\//)) {

              q.defer(function(cb) {
                $.ajax({
                  cache: true,
                  dataType: 'jsonp',
                  jsonp: false,
                  jsonpCallback: value.field.options.split('?callback=')[1] || 'callback',
                  url: value.field.options,
                  success: function(d) {
                    value.field.options = d;
                    cb();
                  }
                });
              });
            }
          });
        } else if (typeof defaultMetadata === 'string') {
          rawMetadata = defaultMetadata;

          try {
            defaultMetadata = jsyaml.load(rawMetadata);
            if (defaultMetadata.date === "CURRENT_DATETIME") {
              var current = (new Date()).format('Y-m-d H:i');
              defaultMetadata.date = current;
              rawMetadata = rawMetadata.replace("CURRENT_DATETIME", current);
            }
          } catch(err) {
            console.log('ERROR encoding YAML');
            // No-op
          }
        }
      }
    }

    q.await((function() {
      cb(err, _.extend(post, {
        'default_metadata': defaultMetadata,
        'markdown': _.markdown(file),
        'repo': repo,
        'path': path,
        'file': file,
        'persisted': true
      }));
    }).bind(this));
  },

  // Load Post
  // -------
  //
  // List all postings for a given repository
  // Looks into _posts/blog

  loadPost: function(user, repo, branch, path, file, cb) {
    repo = this.getRepo(user, repo);

    repo.contents(branch, path ? path + '/' + file : file, _.partial(
      this._loadPostData,
      repo,
      path,
      file,
      cb
    ));
  },

  restoreFile: function(user, repo, branch, path, url, cb) {
    $.ajax({
      type: 'GET',
      url: url,
      headers: {
        Authorization: 'token ' + cookie.get('oauth-token'),
        Accept: 'application/vnd.github.raw'
      },
      success: (function(res) {
        this.saveFile(user, repo, branch, path, res, 'Restored ' + path, function(err) {
          if (err) {
            cb(err);
          } else {
            cb();
          }
        });
      }).bind(this),
      error: function(err) {
        cb(err);
      }
    });
  }
};
