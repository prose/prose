// Gimme a Github object! Please.
function github() {
  return new Github({
    token: $.cookie('oauth-token'),
    auth: "oauth"
  });
}

// Authentication
// -------

function authenticate() {
  if ($.cookie("oauth-token")) return window.authenticated = true;
  var match = window.location.href.match(/\?code=(.*)/);

  // Handle Code
  if (match) {
    var code = match[1];
    $.getJSON('{{site.gatekeeper_url}}/authenticate/'+match[1], function(data) {
      $.cookie('oauth-token', data.token);
      window.authenticated = true;
      window.location.href = window.location.href.replace(/\?code=(.*)/, '');
    });
  }
}


function logout() {
  window.authenticated = false;
  $.cookie("oauth-token", null);
}

// Load Application
// -------
// 
// Load everything that's needed for the app + header


function loadApplication(cb) {

  if (window.authenticated) {
    $.ajax({
      type: "GET",
      url: 'https://api.github.com/user',
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded',
      success: function(res) { 
        $.cookie("avatar", res.avatar_url);
        app.username = res.login;
        var user = github().getUser(app.username);
        var owners = {};

        user.repos(function(err, repos) {
          _.each(repos, function(r) {
            owners[r.owner.login] = owners[r.owner.login] ? owners[r.owner.login].concat([r])
                                                          : [r];
          });
          cb(null, { "available_repos": repos, "owners": owners });
        });
      },
      error: function(err) { 
        logout();
        cb(null, { "available_repos": [], "owners": {} });
      },
      headers : { Authorization : 'token ' + $.cookie('oauth-token') }
    });

  } else {
    cb(null, { "available_repos": [], "owners": {} });
  }
}

// Load Branches
// -------
// 
// List all available Jekyll branches

function loadBranches(user, repo, cb) {
  var repo = github().getRepo(user, repo);

  repo.listBranches(function(err, branches) {
    var jekyllBranches = [],
        processed = 0;

    _.each(branches, function(branch) {
      repo.read(branch, "_config.yml", function(err, data) {
        if (!err) jekyllBranches.push(branch);
        processed += 1;
        if (processed === branches.length) cb(null, jekyllBranches);
      });
    });
  });
}

// Load Site
// -------
// 
// List all postings for a given site plus load _config.yml

function loadSite(user, repo, branch, path, cb) {

  var repo = github().getRepo(user, repo, branch);
  function loadConfig(cb) {
    repo.read(branch, "_config.yml", function(err, data) {
      if (err) return cb(err);
      cb(null, jsyaml.load(data));
    });
  }

  if (!path) path = "_posts";
  repo.getSha(branch, path, function(err, sha) {

    repo.getTree(sha, function(err, tree) {
      if (err) cb("Not a valid Jekyll repository.");

      var paths = _.compact(_.map(tree, function(file) {
        return file.type === "tree" ? path + "/"+ file.path : null
      }));

      paths = [path].concat(paths);

      // Load Jekyll config file (_config.yml)
      loadConfig(function(err, config) {
        if (err) return cb(err);
        app.state.config = config;
        app.state.paths = paths;
        app.state.path = path ? path : paths[0];

        var posts = _.map(tree, function(file) {
          var regex = new RegExp("^(\\w|-)*\.(md|mkdn?|mdown|markdown)$");

          // Make sense of the file path
          function semantify(p) {
            return {
              path: path + "/"+p,
              date: "",
              title: p
            };
          }
          return regex.test(file.path) ? semantify(file.path) : null;
        });
        cb(null, {"posts": _.compact(posts)});
      });
    });
  });
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function savePost(user, repo, branch, path, file, metadata, content, message, cb) {
  var repo = github().getRepo(user, repo);
  function serialize(data) {
    return ["---", data, "---"].join('\n')+'\n\n'+content;
  }
  repo.write(branch, path + "/" + file, serialize(metadata), message, cb);
}


// Delete Post
// -------

function deletePost(user, repo, branch, path, file, cb) {
  var repo = github().getRepo(user, repo);
  repo.remove(branch, path+ "/" + file, cb);
}


// Move Post
// -------

function movePost(user, repo, branch, path, newPath, cb) {
  var repo = github().getRepo(user, repo);
  repo.move(branch, path, newPath, cb);
}

// New Post
// -------
// 
// Prepare new empty post

function emptyPost(user, repo, branch, path, cb) {
  var repo = github().getRepo(user, repo);
  cb(null, {
    "metadata": {
      "layout": "default",
      "published": false,
    },
    "raw_metadata": "published: false",
    "content": "How does it work?\n=================\n\nEnter Text in Markdown format.",
    "repo": repo,
    "path": "_posts",
    "persisted": false,
    "file": new Date().format("Y-m-d")+"-your-filename.md"
  });
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function loadPost(user, repo, branch, path, file, cb) {
  var repo = github().getRepo(user, repo);
  repo.read(branch, path + "/" + file, function(err, data) {
    function parse(content) {
      var res = {};
      var chunked = (content+'\n').replace(/\r\n/g, "\n").split('---\n');
      if (chunked[0] === '' && chunked.length > 2) {
        res.metadata = jsyaml.load(chunked[1]);
        res.raw_metadata = chunked[1].trim();
        res.content = chunked.slice(2).join('---\n');
      } else {
        res.metadata = {};
        res.raw_metadata = "";
        res.content = content;
      }
      return res;
    }
    // Extract metadata
    var post = parse(data);

    cb(err, _.extend(post, {"repo": repo, "path": path, "file": file, "persisted": true}));
  });
}
