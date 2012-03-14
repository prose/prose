// Github.js 0.1.1
// (c) 2012 Michael Aufreiter, Development Seed
// Github.js is freely distributable under the MIT license.
// For all details and documentation:
// http://substance.io/michael/github

(function() {
  var Github;
  var API_URL = 'https://api.github.com';
  
  // Github API
  // -------

  Github = window.Github = function(options) {
    var username = options.username;
    var password = options.password;

    // Util
    // -------

    function _request(method, path, data, cb) {
      $.ajax({
          type: method,
          url: API_URL + path,
          data: JSON.stringify(data),
          dataType: 'json',
          contentType: 'application/x-www-form-urlencoded',
          success: function(res) { cb(null, res); },
          error: function(err) { cb(err); },
          headers : { Authorization : 'Basic ' + Base64.encode(username + ':' + password) }
      });
    }

    // USER API
    // -------

    Github.User = function(options) {
      this.username = options.username;
      var userPath = "/users/" + options.username;
      this.repos = function(cb) {
        _request("GET", userPath + "/repos?type=all", null, function(err, res) {
          cb(err, res);
        });
      }
    };


    // Repository API
    // -------

    Github.Repository = function(options) {
      var repo = options.name;
      var branch = options.branch;
      
      var that = this;
      var repoPath = "/repos/" + username + "/" + repo;

      // Get latest commit from master
      function getLatestCommit(cb) {
        _request("GET", repoPath + "/git/refs/heads/" + branch, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.object.sha);
        });
      }

      // Retrieve the contents of a blob
      function getBlob(sha, cb) {
        _request("GET", repoPath + "/git/blobs/" + sha, null, function(err, res) {
          cb(err, res);
        });
      }

      // Retrieve the tree a commit points to

      function getTree(commit, cb) {
        _request("GET", repoPath + "/git/trees/"+commit, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      }

      // Post a new blob object, getting a blob SHA back

      function postBlob(content, cb) {
        var data = {
          "content": content,
          "encoding": "utf-8"
        };
        _request("POST", repoPath + "/git/blobs", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      }

      // Post a new tree object having a file path pointer replaced
      // with a new blob SHA getting a tree SHA back

      function postTree(baseTree, path, blob, cb) {
        var data = {
          "base_tree": baseTree,
          "tree": [
            {
              "path": path,
              "mode": "100644",
              "type": "blob",
              "sha": blob
            }
          ]
        };
        _request("POST",  repoPath + "/git/trees", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Create a new commit object with the current commit SHA as the parent
      // and the new tree SHA, getting a commit SHA back

      function createCommit(parent, tree, cb) {
        var data = {
          "message": "Spooky. Isn't it?",
          "author": {
            "name": "Ghost"
          },
          "parents": [
            parent
          ],
          "tree": tree
        };

        _request("POST", repoPath + "/git/commits", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      }

      // Update the reference of your head to point to the new commit SHA

      function updateHead(commit, cb) {
        _request("PATCH", repoPath + "/git/refs/heads/" + branch, { "sha": commit }, function(err, res) {
          cb(err);
        });
      }



      // Show repository information
      // -------

      this.show = function(cb) {
        _request("GET", repoPath, null, function(err, res) {
          cb();
        });
      };

      // List all files
      // -------

      this.list = function(cb) {
        _request("GET", repoPath + "/git/trees/" + branch + "?recursive=1", null, function(err, res) {
          cb(err, res ? res.tree : null);
        });
      };


      // Read file at given path
      // -------

      this.read = function(path, cb) {
        that.list(function(err, tree) {
          var file = _.select(tree, function(file) {
            return file.path === path;
          })[0];

          if (!file) return cb("not found", null);

          getBlob(file.sha, function(err, blob) {
            function decode(blob) {
              if (blob.content) {
                var data = blob.encoding == 'base64' ?
                    atob(blob.content.replace(/\s/g, '')) :
                    blob.content;
                    
                return data;
              } else {
                return "";
              }
            }

            cb(null, decode(blob));
          });
        });
      };

      // Write file contents on a given path
      // -------

      this.write = function(path, content, cb) {
        getLatestCommit(function(err, latestCommit) {
          getTree(latestCommit, function(err, tree) {
            postBlob(content, function(err, blob) {
              postTree(tree, path, blob, function(err, tree) {
                createCommit(latestCommit, tree, function(err, commit) {
                  updateHead(commit, function(err) {
                    cb(err);
                  });
                });
              });
            });
          });
        });
      };
    };

    // Top Level API
    // -------

    this.getRepo = function(repo, branch) {
      return new Github.Repository({name: repo, branch: branch || "master"});
    };

    this.getUser = function(user) {
      return new Github.User({username: user});
    };
  };
}).call(this);