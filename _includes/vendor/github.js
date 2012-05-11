// Github.js 0.3.0
// (c) 2012 Michael Aufreiter, Development Seed
// Github.js is freely distributable under the MIT license.
// For all details and documentation:
// http://substance.io/michael/github

(function() {
  var Github;
  var API_URL = 'https://api.github.com';

  Github = window.Github = function(options) {
    var username = options.username;
    var password = options.password;

    // Util
    // =======

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
    // =======

    Github.User = function() {
      this.repos = function(cb) {
        _request("GET", "/user/repos?type=all&per_page=100", null, function(err, res) {
          cb(err, res);
        });
      };
    };


    // Repository API
    // =======

    Github.Repository = function(options) {
      var repo = options.name;
      var branch = options.branch;
      var user = options.user;
      
      var that = this;
      var repoPath = "/repos/" + user + "/" + repo;

      // Get a particular reference
      // -------

      this.getRef = function(ref, cb) {
        _request("GET", repoPath + "/git/refs/heads/" + ref, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.object.sha);
        });
      };

      // List all branches of a repository
      // -------

      this.listBranches = function(cb) {
        _request("GET", repoPath + "/git/refs/heads", null, function(err, heads) {
          if (err) return cb(err);
          cb(null, _.map(heads, function(head) { return _.last(head.ref.split('/')); }));
        });
      };

      // Retrieve the contents of a blob
      // -------

      this.getBlob = function(sha, cb) {
        _request("GET", repoPath + "/git/blobs/" + sha, null, function(err, res) {
          cb(err, res);
        });
      };


      // For a given file path, get the corresponding sha (blob for files, tree for dirs)
      // TODO: So inefficient, it sucks hairy donkey balls.
      // -------

      this.getSha = function(branch, path, cb) {
        that.getTree(branch+"?recursive=true", function(err, tree) {
          var file = _.select(tree, function(file) {
            return file.path === path;
          })[0];
          cb(null, file ? file.sha : null);
        });
      };

      // Retrieve the tree a commit points to
      // -------

      this.getTree = function(tree, cb) {
        _request("GET", repoPath + "/git/trees/"+tree, null, function(err, res) {
          if (err) return cb(err);
          cb(null, res.tree);
        });
      };

      // Post a new blob object, getting a blob SHA back
      // -------

      this.postBlob = function(content, cb) {
        var data = {
          "content": content,
          "encoding": "utf-8"
        };
        _request("POST", repoPath + "/git/blobs", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Post a new tree object having a file path pointer replaced
      // with a new blob SHA getting a tree SHA back
      // -------

      this.postTree = function(baseTree, path, blob, cb) {
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
        _request("POST", repoPath + "/git/trees", data, function(err, res) {
          if (err) return cb(err);
          cb(null, res.sha);
        });
      };

      // Create a new commit object with the current commit SHA as the parent
      // and the new tree SHA, getting a commit SHA back
      // -------

      this.commit = function(parent, tree, message, cb) {
        var data = {
          "message": message,
          "author": {
            "name": username
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
      };

      // Update the reference of your head to point to the new commit SHA
      // -------

      this.updateHead = function(head, commit, cb) {
        _request("PATCH", repoPath + "/git/refs/heads/" + head, { "sha": commit }, function(err, res) {
          cb(err);
        });
      };

      // Show repository information
      // -------

      this.show = function(cb) {
        _request("GET", repoPath, null, function(err, info) {
          cb(null, info);
        });
      };

      // Read file at given path
      // -------

      this.read = function(branch, path, cb) {
        that.getSha(branch, path, function(err, sha) {
          if (!sha) return cb("not found", null);

          that.getBlob(sha, function(err, blob) {
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

      // Write file contents to a given branch and path
      // -------

      this.write = function(branch, path, content, message, cb) {
        that.getRef(branch, function(err, latestCommit) {
          that.postBlob(content, function(err, blob) {
            that.postTree(latestCommit, path, blob, function(err, tree) {
              that.commit(latestCommit, tree, message, function(err, commit) {
                that.updateHead(branch, commit, function(err) {
                  cb(err);
                });
              });
            });
          });
        });
      };
    };

    // Top Level API
    // -------

    this.getRepo = function(user, repo, branch) {
      return new Github.Repository({user: user, name: repo, branch: branch || "master"});
    };

    this.getUser = function() {
      return new Github.User();
    };
  };
}).call(this);