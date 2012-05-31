Poole
=================

**Poole** is a web-interface dedicated for managing dynamic content of Jekyll-based websites. Users of Jekyll can create, edit and delete files that live within the `_posts` directory. Poole is a smart way of publishing for hackers AND [humans](http://www.fyears.org/2012/05/jekyll-for-hackers-not-for-humans), solving the issue that Jekyll is has not yet been suitable for non-technical people who maintain content.

While developers can still enjoy all freedom the Jekyll framework provides, editors can easily access, edit and publish content using a visual interface. Here is how it works:

Login with your Github User
-----------------

It was challenging, but Poole supports OAuth. I think it's very important to use OAuth over Basic Authentication, since Github data can be very sensible and no one wants to risk getting his password sniffed.

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

Poole itself is just a static webpage, and doesn't require any server-side bits. Instead it interacts directly with the Github API for managing your repo's contents. 

The Github API is somewhat funky from time to time, and hard to debug. We had to be aware of CORS issues and properly setting up headers for authorization. What's challenging here, is that Github just offers a low level API (around trees and blobs), which is problematic in many cases, as it requires a lot of subsequent requests to do simple things, which slows down site performance. That's why creating a good architecture was crucial to manage the complexity. I ended up in abstracting the data layer into a separate module, Github.js.


Github.js
-----------------

[Github.js](https://github.com/michael/github) is a higher-level wrapper around the Github API. It's intended for exactly our use case, namely interacting with Github from the browser. It supports reading, writing, renaming and deleting files. Goal was to have a simple data abstraction layer, nothing to fancy, but providing exactly the operations we need.


Gatekeeper
-----------------

Because of some [security-related limitations](http://blog.vjeux.com/2012/javascript/github-oauth-login-browser-side.html), Github prevents you from implementing the OAuth Web Application Flow on a client-side only application.

This is a real bummer. So I built [Gatekeeper](http://github.com/developmentseed/gatekeeper), which is the missing piece you need in order to make it work.


Installation
=================

1. Fork and clone the repo in order to run your own instance of Poole.

2. Setup a Github application, so CORS requests are possible as well as OAuth authentication.

   ![Setup Github Application](http://f.cl.ly/items/011W1c0D2N1I0B3m0731/Screen%20Shot%202012-05-31%20at%203.33.15%20PM.png)

3. Setup Gatekeeper

   Follow the instructions here and fill in the information that is provided after registering a new Github Application.

4. Adjust `_config.yml`

   ```
   auto: true
   server: true
   oauth_client_id: your_oauth_client_id
   gatekeeper_url: http://gatekeeper.example.com
   exclude:
   - .gitignore
   - README.md
   ```

5. Run it
   ```
   server:poole poole$ jekyll
   ```

Limitations
=================

The Github API comes with a number of limitations because of its low-level nature. Here is a the list of known issues related to that. I hope the folks at Github can help us (with some minor additions to their API) so we can eliminate them.

- Listing Repositories
  
  When listing the repositories, we can't determine which of them are actual Jekyll sites. Theoretically we could, by issuing a separate request that fetches repository information (such as branches) and looks for a `_config.yml` file. However this is way to slow, so we have to do it on-demand as you click on a repository.

- Organizations
  
  Repositories that live within your organizations can only be accessed by entering the url (`/:organization/:repo/:branch`) manually.

- Deleting and renaming files
  
  This requires a full tree to be written involving a new commit that points to that tree. In fact this is not a big problem with small repositories, but once they get bigger it's not only a performance issue, you'll get errors. Be aware that you may not (yet) be able to rename or delete files when working with bigger repositories.