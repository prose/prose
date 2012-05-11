
// Gimme a Github object! Please.
function github() {
  return new Github({
    username: app.username,
    password: app.password,
    auth: "basic"
  });
}


// Authentication
// -------
// 
// Load everything that's needed for the app + header

function login(credentials, cb) {
  $.ajax({
      type: "GET",
      url: 'https://api.github.com/users/michael',
      dataType: 'json',
      contentType: 'application/x-www-form-urlencoded',
      success: function(res) { 
        $.cookie("auth", Base64.encode(JSON.stringify(credentials)));
        cb(null);
      },
      error: function(err) { cb("Bad credentials"); },
      headers : { Authorization : 'Basic ' + Base64.encode(credentials.username + ':' + credentials.password) }
  });
}

function logout() {
  $.cookie("auth", null);
}

function getCredentials() {
  var auth = $.cookie('auth'),
      credentials = auth ? JSON.parse(Base64.decode(auth)) : null;
  if (credentials) app.username = credentials.username;
  return credentials;
}

function authenticated() {
  return !!getCredentials();
}

// Load Application
// -------
// 
// Load everything that's needed for the app + header


function loadApplication(cb) {
  if (app.username) {
    var user = github().getUser(app.username);
    user.repos(function(err, repos) {
      cb(null, { "available_repos": repos });
    });
  } else {
    cb(null, { "available_repos": [] });
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

  repo.getTree(branch+"?recursive=1", function(err, tree) {
    if (err) cb("Not a valid Jekyll repository.");

    var paths = _.compact(_.map(tree, function(file) {
      var regex = new RegExp("^_posts");
      return file.type === "tree" && regex.test(file.path) ? file.path : null
    }));

    // Load Jekyll config file (_config.yml)
    loadConfig(function(err, config) {
      if (err) return cb(err);
      app.state.config = config;
      app.state.paths = paths;
      app.state.path = path ? path : paths[0];

      var posts = _.map(tree, function(file) {
        var regex = new RegExp("^" + app.state.path + "/(\\w|-)*.md$");

        // Make sense of the file path
        function semantify(path) {
          // TODO: put regexp to _config.yml
          var regexp = new RegExp("^(.*)/(\\d{4}-\\d{2}-\\d{2})-(.*).md$");
          var groups = path.match(regexp);

          function prettifyTitle(str) { 
            return str.replace(/-/g, " ").replace(/^./, str[0].toUpperCase());
          }

          return {
            path: path,
            date: new Date(groups[2]),
            title: prettifyTitle(groups[3])
          }
        }
        return regex.test(file.path) ? semantify(file.path) : null;
      });

      cb(null, {"posts": _.compact(posts)});
    });
  });
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function savePost(user, repo, branch, path, file, metadata, content, message, cb) {
  var repo = github().getRepo(user, repo, branch);
  function serialize(data) {
    return ["---", data, "---"].join('\n')+'\n\n';
  }
  repo.write(branch, path + "/" + file, serialize(metadata)+content, message, cb);
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
      var chunked = (content+'\n').split('---\n');
      if (chunked[0] === '' && chunked.length > 2) {
        res.metadata = jsyaml.load(chunked[1]);
        res.raw_metadata = chunked[1].trim();
        res.content = chunked.slice(2).join('---\n');
      } else {
        res.metadata = {};
        res.content = content;
      }
      return res;
    }

    // Extract metadata
    var post = parse(data);

    // We're done. Can you hear me?!
    cb(err, _.extend(post, {"repo": repo, "path": path, "file": file}));
  });
}
