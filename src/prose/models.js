var $ = require('jquery-browserify');
var _ = require('underscore');
var jsyaml = require('js-yaml');
var cookie = require('./cookie');
var Github = require('../libs/github');

// Set up a GitHub object
// -------

function github() {
  return new Github({
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
      $.getJSON('http://prose-gatekeeper.herokuapp.com/authenticate/' + match[1], function (data) {
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
        url: 'https://api.github.com/user',
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

  // Load Repos
  // -------
  //
  // List all available repositories for a certain user

  loadRepos: function(username, cb) {
    var user = github().getUser();

    user.show(username, function (err, u) {
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
    if (repos.state.user === app.username) {

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
        owners: owners,
        state: repos.state
      };

    } else {
      listings = _(repos.repos).filter(function (repo) {

        if (searchstr && searchstr.length) {
          repo.name = repo.name.replace(matchSearch, '$1');
        }

        if (!searchstr) return true;
        return repo.name.toLowerCase().search(searchstr.toLowerCase()) >= 0;
      });

      // TODO sort by name eg: listigs = _(listings).sortby( ...
      return {
        repos: listings,
        state: repos.state
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
    var files = _.filter(tree, function (file) {
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
  // Load _config.yml or _prose.yml

  loadConfig: function(user, reponame, branch, cb) {
    var repo = this.getRepo(user, reponame);
    repo.contents(branch, '_config.yml', function(err, data) {
      if (err) return cb(err);

      app.state.config = jsyaml.load(data);
      cb(err, jsyaml.load(data));
    });
  },

  // Load Posts
  // -------
  //
  // List all postings for a given repo+branch+path
  // plus load _config.yml or _prose.yml

  loadPosts: function(user, reponame, branch, path, cb) {
    var that = this;
    var repo = this.getRepo(user, reponame);

    function loadConfig(cb) {
      repo.contents(branch, '_config.yml', function(err, data) {
        if (err) return cb(err);
        cb(null, jsyaml.load(data));
      });
    }

    function load(repodata) {
      loadConfig(function(err, config) {
        app.state.jekyll = !err;
        app.state.config = config;

        var root = config && config.prose && config.prose.rooturl ? config.prose.rooturl : '';

        if (!path) path = root;

        repo.getTree(branch + '?recursive=true', function (err, tree) {
          if (err) return cb('Not found');
          that.loadBranches(user, reponame, function (err, branches) {
            if (err) return cb("Branches couldn't be fetched");
            app.state.path = path ? path : '';

            app.state.branches = _.filter(branches, function (b) {
              return b !== branch;
            });
            repo.getSha(branch, app.state.path, function (err, sha) {
              app.state.sha = sha;
            });
            cb(null, that.getFiles(tree, path, ''));
          });
        });
      });
    }

    repo.show(function (err, repodata) {
      if (!branch) app.state.branch = branch = repodata.master_branch;

      app.state.isPrivate = repodata.private;
      app.state.permissions = repodata.permissions;
      load();
    });
  },

  // Serialize
  // -------

  serialize: function(content, metadata) {
    if (metadata) {
      return ['---', metadata, '---'].join('\n') + '\n\n' + content;
    } else {
      return content;
    }
  },

  // Save File
  // -------
  //
  // Store a file to GitHub

  saveFile: function(user, repo, branch, path, content, message, cb) {
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
      _.delay(function () {
        forkedRepo.contents('', function (err, contents) {
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
    repo.createPullRequest(pull, function (err) {
      cb();
    });
  },

  // Patch File
  // -------
  //
  // Send a pull request on GitHub

  patchFile: function(user, repo, branch, path, content, message, cb) {
    var that = this;
    this.forkRepo(user, repo, branch, function (err, info) {
      branch = info.ref.substring(info.ref.lastIndexOf('/') + 1);
      that.saveFile(app.username, repo, branch, path, content, message, function (err) {
        if (err) return cb(err);
        var pull = {
          title: message,
          body: 'This pull request has been automatically generated by prose.io.',
          base: app.state.branch,
          head: app.username + ':' + branch
        };
        that.createPullRequest(app.state.user, app.state.repo, pull, cb);
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

    var cfg = app.state.config;
    if (cfg && cfg.prose && cfg.prose.metadata && cfg.prose.metadata[path]) {
      rawMetadata = cfg.prose.metadata[path];
      if (typeof rawMetadata === 'object') {
        defaultMetadata = rawMetadata;

        _.each(rawMetadata, function(data, key) {
          var selected;

          if (data && typeof data.field === 'object') {
            selected = data.field.selected;

            switch(data.field.element) {
              case 'text':
                metadata[data.name] = data.field.value;
                break;
              case 'select':
              case 'multiselect':
                metadata[data.name] = selected ? selected : null;
                break;
            }
          } else {
            metadata[key] = data;
          }
        });
      } else if (typeof rawMetadata === 'string') {
        try {
          defaultMetadata = jsyaml.load(rawMetadata);

          _.each(rawMetadata, function(data, key) {
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

    // If ?file= in path, use it as file name
    if (path.indexOf('?file=') !== -1) {
      file = path.split('?file=')[1];
      path = path.split('?file=')[0].replace(/\/$/, '');
    }

    cb(null, {
      'metadata': metadata,
      'raw_metadata': rawMetadata,
      'default_metadata': defaultMetadata,
      'content': '# How does it work?\n\nEnter Text in Markdown format.',
      'repo': repo,
      'path': path,
      'published': false,
      'persisted': false,
      'writeable': true,
      'file': file
    });
  },

  // Load Post
  // -------
  //
  // List all postings for a given repository
  // Looks into _posts/blog

  loadPost: function(user, repo, branch, path, file, cb) {
    repo = this.getRepo(user, repo);

    repo.contents(branch, path ? path + '/' + file : file, function(err, data, commit) {
      if (err) return cb(err);

      // Given a YAML front matter, determines published or not

      function published(metadata) {
        return !!metadata.match(/published: true/);
      }

      // Extract YAML from a post, trims whitespace

      function parse(content) {
        content = content.replace(/\r\n/g, '\n'); // normalize a little bit

        function writeable() {
          return !!(app.state.permissions && app.state.permissions.push);
        }

        if (!_.hasMetadata(content)) return {
          raw_metadata: '',
          content: content,
          published: false,
          writeable: writeable()
        };

        var res = {
          raw_metadata: '',
          published: false,
          writeable: writeable()
        };
        res.content = content.replace(/^(---\n)((.|\n)*?)\n---\n?/, function (match, dashes, frontmatter) {
          res.raw_metadata = frontmatter;
          res.metadata = jsyaml.load(frontmatter);
          res.published = published(frontmatter);
          return '';
        }).trim();
        return res;
      }

      var post = parse(data);
      var rawMetadata;
      var defaultMetadata;

      // load default metadata
      var cfg = app.state.config;
      if (cfg && cfg.prose && cfg.prose.metadata && cfg.prose.metadata[path]) {
        rawMetadata = cfg.prose.metadata[path];
        if (typeof rawMetadata === 'object') {
          defaultMetadata = rawMetadata;
        } else if (typeof rawMetadata === 'string') {
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

      cb(err, _.extend(post, {
        'default_metadata': defaultMetadata,
        'sha': commit,
        'markdown': _.markdown(file),
        'jekyll': _.hasMetadata(data),
        'repo': repo,
        'path': path,
        'file': file,
        'persisted': true
      }));
    });
  }
};
