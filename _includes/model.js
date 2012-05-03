
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
  // Filter out Jekyll-sites
  function filter(repos, cb) {
    var remaining = repos.length;
    var filteredRepos = [];

    _.each(repos, function(r) {
      if (r.name.match(/.github.com/)) {
        filteredRepos.push(r);
        if ((remaining -= 1) === 0) cb(null, filteredRepos);
      } else {
        var repo = github().getRepo(r.name, "gh-pages");
        repo.getRef("gh-pages", function(err, sha) {
          if (!err) filteredRepos.push(r);
          if ((remaining -= 1) === 0) cb(null, filteredRepos);        
        });
      }
    });
  }

  if (app.username) {
    var user = github().getUser(app.username);
    user.repos(function(err, repos) {
      cb(null, { "available_repos": repos });
      // filter(repos, function(err, repos) {
      //   cb(null, { "available_repos": repos });
      // });
    });
  } else {
    cb(null, { "available_repos": [] });
  }
}


// Load Site
// -------
// 
// List all postings for a given site plus load _config.yml

function loadSite(username, reponame, branch, path, cb) {

  var repo = github().getRepo(reponame, branch);

  function loadConfig(cb) {
    repo.read("_config.yml", function(err, data) {
      if (err) return cb(err);
      cb(null, jsyaml.load(data));
    });
  }

  repo.list(function(err, tree) {
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

function savePost(username, reponame, branch, path, file, metadata, content, message, cb) {
  var repo = github().getRepo(reponame, branch);
  function serialize(data) {
    return "---\n" + _.toYAML(data) + "\n---\n\n";
  }
  repo.write(path + "/" + file, serialize(metadata)+content, message, cb);
}


// Save Post
// -------
// 
// List all postings for a given repository
// Looks into _posts/blog

function loadPost(username, reponame, branch, path, file, cb) {
  var repo = github().getRepo(reponame, branch);

  repo.read(path + "/" + file, function(err, data) {

    function parse(content) {
      var res = {};
      var chunked = (content+'\n').split('---\n');
      if (chunked[0] === '' && chunked.length > 2) {
        res.metadata = jsyaml.load(chunked[1]);
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
    cb(err, _.extend(post, {"repo": reponame, "path": path, "file": file}));
  });
}
