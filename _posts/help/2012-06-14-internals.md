---
layout: help
published: true
title: Internals
descr: You want to run your own instance of Prose? Here's what you need to know.
image: http://farm7.staticflickr.com/6119/6884293596_b44a31bf0a_m.jpg
author_twitter: _mql
author: Michael Aufreiter
categories:
- help
---


Prose itself is just static webpage and doesn't require any server-side bits. Instead it interacts directly with the Github API for managing your repo's contents. This means there's nothing to setup, no database no fileserver no nothing.

Using just the Github API for powering our editor was not easy. We had to be aware of CORS issues and properly setting up headers for authorization. What's challenging here, is that Github just offers a low level API (around trees and blobs), which is problematic in many cases, as it requires a lot of subsequent requests to do simple things, which slows down site performance. That's why creating a good architecture was crucial to manage the complexity. I ended up in abstracting the data layer into a separate module, Github.js.


## Github.js

[Github.js](https://github.com/michael/github) is a higher-level wrapper around the Github API. It's intended for exactly our use case, namely interacting with Github from the browser. It supports reading, writing, renaming and deleting files. Goal was to have a simple data abstraction layer, nothing to fancy, but providing exactly the operations we need.


## Gatekeeper

Because of some [security-related limitations](http://blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html), Github prevents you from implementing the OAuth Web Application Flow on a client-side only application.

This is a real bummer. So we built [Gatekeeper](http://github.com/developmentseed/gatekeeper), which is the missing piece you need in order to make OAuth work.



# Installation

1. Fork and clone the repo in order to run your own instance of Prose.

2. Setup a Github application, so CORS requests are possible as well as OAuth authentication.

   ![Setup Github Application](http://f.cl.ly/items/011W1c0D2N1I0B3m0731/Screen%20Shot%202012-05-31%20at%203.33.15%20PM.png)

3. Setup Gatekeeper.

   Follow the instructions here and fill in the information that is provided after registering a new Github Application.

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


The Github API comes with a number of limitations because of its low-level nature. Here is a the list of known issues related to that. I hope the folks at Github can help us (with some minor additions to their API) so we can eliminate them.

- Listing Repositories
  
  When listing the repositories, we can't determine which of them are actual Jekyll sites. Theoretically we could, by issuing a separate request that fetches repository information (such as branches) and looks for a `_config.yml` file. However this is way to slow, so we have to do it on-demand as you click on a repository.

- Organizations
  
  Repositories that live within your organizations can only be accessed by entering the url (`/:organization/:repo/:branch`) manually.

- Deleting and renaming files
  
  This requires a full tree to be written involving a new commit that points to that tree. In fact this is not a big problem with small repositories, but once they get bigger it's not only a performance issue, you'll get errors. Be aware that you may not (yet) be able to rename or delete files when working with bigger repositories.