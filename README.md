Poole
=================

**Poole** is a web-interface dedicated for managing dynamic content of Jekyll-based websites. Users of Jekyll can create, edit and delete files that live within the _posts directory. Poole itself is also just a static webpage, and doesn't require any server-side bits. Instead it interacts directly with the Github API for managing your repo's contents. Once we are ready, Poole will feature a quickstart page, that can maintained in Poole itself. Crazy, isn't it?


Okay, here's how it works:

Login with your Github User
-----------------

It was challenging, but Poole now supports OAuth. I think it's very important to use OAuth over Basic Auth, since Github data can be very sensible and no one wants to risk getting his password sniffed.

![Start](http://f.cl.ly/items/0t0A170b2Y093F2u1w45/Screen%20Shot%202012-05-23%20at%205.48.45%20PM.png)


Browse Repositories
-----------------

This is the landing page, it gives you all the repositories you have access to. If a Jekyll site has multiple branches, you are prompted to select your desired branch, otherwise, you jump into the repo directly.

![Repositories](http://cl.ly/3p0v3b1q011w123b1O2c/Screen%20Shot%202012-05-23%20at%205.11.42%20PM.png)


Browsing Posts
-----------------

Once you have selected a repository, you can browse your posts and sub-folders in a traditional file-browser-ish manner. You can create new files here as well, which immediately opens an empty document for you, which you can save after populating it with some text.

![Posts](http://f.cl.ly/items/0e0D1s292j422S0N3723/Screen%20Shot%202012-05-23%20at%204.58.48%20PM.png)


Edit Posts
-----------------

We use CodeMirror, a great software that makes browser-based editing a pleasure (the first time). Compared to a regular textarea, which has an annoying inline scoller this is a huge step forward I think.

![Edit](http://f.cl.ly/items/3E0Q2K3V0M3z1O2j1r1H/Screen%20Shot%202012-05-22%20at%201.53.28%20AM.png)


Preview
-----------------

You can instantly preview your writing by either clicking the preview icon at the document menu bar, or use that fance keyboard combo ctrl+shift+p to toggle Preview on and off.

![Preview](http://f.cl.ly/items/1t2I3s2o0s3D2u1E270x/Screen%20Shot%202012-05-23%20at%205.03.29%20PM.png)


Publish
-----------------

Once you are ready, you can easily publish your article, which lets it show up on the actual webpage/blog.

![Publish](http://f.cl.ly/items/302m2R2l0x090h0k0s21/Screen%20Shot%202012-05-23%20at%205.03.43%20PM.png)


Metadata
-----------------

Take full control about your post, and edit Metadata aka the YAML frontmatter. No limitations.

![Repositories](http://f.cl.ly/items/1v0a3E0C1Z3z2s3N473v/Screen%20Shot%202012-05-23%20at%205.04.01%20PM.png)


Architecture
=================

The Github API is somewhat funky from time to time, and very hard to debug. A hell of CORS issues and headers-foo. The thing that is challenging here, is that Github just offers a low level API (around trees and blobs), which is problematic in many cases, as it requires a lot of subsequent requests to do simple things, which slows down site performance. That's why creating a good architecture was crucial to manage the complexity. I ended up in abstracting the data layer into a separate module, Github.js


Github.js
-----------------

[Github.js](https://github.com/michael/github) is a higher-level wrapper around the Github API. It's intended for exactly our use case, namely interacting with Github from the browser. It supports reading, writing, renaming and deleting files. Goal was to have a simple data abstraction layer, nothing to fancy, but providing exactly the operations we need.


Gatekeeper
-----------------

Because of some [security-related limitations](http://blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html), Github prevents you from implementing the OAuth Web Application Flow on a client-side only application.

This is a real bummer. So I built [Gatekeeper](http://github.com/developmentseed/gatekeeper), which is the missing piece you need in order to make it work.