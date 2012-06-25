---
layout: help
title: Internals
descr: A little background on how we implemented Prose.
image: http://prose.io/images/help/internals.png
author_twitter: _mql
author: Michael Aufreiter
categories:
- help
published: true
---

Prose is just a static webpage and doesn't require any server-side bits. Instead it interacts directly with the GitHub API for managing your repo's contents. This means there's nothing to setup, no database no fileserver etc. This is imporant because we want to make it easy for you to get involved in the development.

Using just the GitHub API for powering our editor was not easy. GitHub just offers a low level API (around trees and blobs), which is challening in many cases, as it requires a lot of subsequent requests to do simple things, which slows down site performance. That's why creating a good architecture was crucial to manage the complexity. We ended up in abstracting the data layer into a separate module, Github.js.


## Github.js

[Github.js](https://github.com/michael/github) is a higher-level wrapper around the GitHub API. It's intended for exactly our use case, namely interacting with GitHub from the browser. It supports reading, writing, renaming and deleting files. Goal was to have a simple data abstraction layer, nothing too fancy, but providing exactly the operations we need.


## Gatekeeper

Because of some [security-related limitations](http://blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html), GitHub prevents you from implementing the OAuth Web Application Flow on a client-side only application.

This is a real bummer. So we built [Gatekeeper](http://github.com/prose/gatekeeper), which is the missing piece you need in order to make OAuth work.



# Installation

1. Fork and clone the repo in order to run your own instance of Prose.

2. Setup a GitHub application, so CORS requests are possible as well as OAuth authentication.

   ![Setup GitHub Application](http://prose.io/images/screenshots/github-app-settings.png)

3. Setup Gatekeeper.

   Follow the instructions here and fill in the information that is provided after registering a new GitHub Application.

4. Adjust `_config.yml`.

       auto: true
       server: true
       oauth_client_id: your_oauth_client_id
       gatekeeper_url: http://gatekeeper.example.com
       exclude:
       - .gitignore
       - README.md

5. Run it.
   
       server:prose prose$ jekyll


# Limitations

The GitHub API comes with a number of limitations because of its low-level nature. Here is a the list of known issues related to that. I hope the folks at GitHub can help us (with some minor additions to their API) so we can eliminate them.

- Listing Repositories
  
  When listing the repositories, we can't determine which of them are actual Jekyll sites. Theoretically we could, by issuing a separate request that fetches repository information (such as branches) and looks for a `_config.yml` file. However this is way too slow, so we have to do it on-demand as you click on a repository.

- Organizations
  
  Repositories that live within your organizations can only be accessed by entering the url (`/:organization/:repo/:branch`) manually.

- Deleting and renaming files
  
  This requires a full tree to be written involving a new commit that points to that tree. In fact this is not a big problem with small repositories, but once they get bigger it's not only a performance issue, you'll get errors. Be aware that you may not (yet) be able to rename or delete files when working with bigger repositories.


