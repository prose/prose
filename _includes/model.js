// Gimme a Github object! Please.
function github() {
  return new Github({
    token: $.cookie('oauth-token'),
    username: $.cookie('username'),
    auth: "oauth"
  });
}

// Helpers
// -------

function isMarkdown(filename) {
  var regex = new RegExp("^(\\w|-)*\.(md|mkdn?|mdown|markdown)$");
  return regex.test(filename);
}

// Authentication
// -------

function authenticate() {
  if ($.cookie("oauth-token")) return window.authenticated = true;
  var match = window.location.href.match(/\?code=([a-z0-9]*)/);

  console.log('match', match);

  // Handle Code
  if (match) {
    console.log('match found..', match[1]);
    console.log('debug', '{{site.gatekeeper_url}}/authenticate/'+match[1]);
    $.getJSON('{{site.gatekeeper_url}}/authenticate/'+match[1], function(data) {
      $.cookie('oauth-token', data.token);
      window.authenticated = true;
      // Adjust URL
      var regex = new RegExp("\\?code="+match[1]);
      window.location.href = window.location.href.replace(regex, '');
    });
    return false;
  } else {
    return true;  
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
        $.cookie("username", res.login);
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
    cb(null, branches);
    // FOR REFERENCE: Jekyll deterimination
    // var jekyllBranches = [],
    //     processed = 0;

    // _.each(branches, function(branch) {
    //   repo.read(branch, "_config.yml", function(err, data) {
    //     if (!err) jekyllBranches.push(branch);
    //     processed += 1;
    //     if (processed === branches.length) cb(null, jekyllBranches);
    //   });
    // });
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


  loadConfig(function(err, config) {
    app.state.jekyll = !err;

    if (!path) path = app.state.jekyll ? "_posts" : "";

    repo.getSha(branch, path, function(err, sha) {
      repo.getTree(sha, function(err, tree) {
        if (err) cb("Not a valid Jekyll repository.");

        var paths = _.compact(_.map(tree, function(file) {
          return file.type === "tree" ? (path ? path + "/" : "")+ file.path : null;
        }));

        paths = [path].concat(paths);
        app.state.config = config;
        app.state.paths = paths;
        app.state.path = path ? path : paths[0];

        var posts = _.map(tree, function(file) {
          // Make sense of the file path
          function semantify(p, filetype) {
            return {
              path: path == "" ? p : path + "/"+p,
              date: "",
              filetype: filetype,
              title: p
            };
          }

          if (isMarkdown(file.path)) return semantify(file.path, "markdown");
          if (!app.state.jekyll) return semantify(file.path, "file");
          return null;
        });
        
        cb(null, {"posts": _.compact(posts.reverse())});
      });
    });
  });
}


// Save File
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function saveFile(user, repo, branch, path, file, metadata, content, message, cb) {
  var repo = github().getRepo(user, repo);
  function serialize() {
    if (app.state.jekyll && isMarkdown(file)) {
      return ["---", metadata, "---"].join('\n')+'\n\n'+content;
    } else {
      return content;
    }
  }
  var path = path ? path+ "/"+ file : file;
  repo.write(branch, path, serialize(), message, cb);
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

  repo.read(branch, path ? path + "/" + file : file, function(err, data) {

    function parse(content) {
      if (!app.state.jekyll) return {
        metadata: {},
        raw_metadata: "",
        content: content
      };

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
    cb(err, _.extend(post, {"markdown": isMarkdown(file), "jekyll": app.state.jekyll, "repo": repo, "path": path, "file": file, "persisted": true}));
  });
}
