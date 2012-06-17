---
layout: help
title: Getting Started
descr: A brief introduction on how to use Prose, what it can do for you and what not.
image: http://farm7.staticflickr.com/6119/6884293596_b44a31bf0a_m.jpg
author_twitter: _mql
author: Michael Aufreiter
categories:
- help
published: false
---

This little guide walks you through the process of using Prose to manage your website.

# Create your first Jekyll webpage if you haven't already

We've created a simple Jekyll-based website that you can use as a starting point, [Prose Bootrap](http://bootstrap.prose.io). All you have to do is creating a fork of the repository and give it a suitable new name. Please follow the steps described on the Bootstrap homepage. If you already maintaining a Jekyll page you can skip this step.

# Open Prose

You can sign in to Github by using OAuth.

![Start](http://f.cl.ly/items/0t0A170b2Y093F2u1w45/Screen%20Shot%202012-05-23%20at%205.48.45%20PM.png)


# Browse Repositories

Here's the landing page, it gives you all the repositories you have access to. If a Jekyll site has multiple branches, you are prompted to select your desired branch, otherwise you jump into the repo directly. We're going to pick our fresh bootstraped site here.

![Repositories](http://cl.ly/3p0v3b1q011w123b1O2c/Screen%20Shot%202012-05-23%20at%205.11.42%20PM.png)


# Browsing Posts

Once you have selected a repository, you can browse your posts and sub-folders in a traditional file-browser-ish manner. You can create new files as well, which immediately opens an empty document for you, which you can save after populating it with some text.

![Posts](http://f.cl.ly/items/0e0D1s292j422S0N3723/Screen%20Shot%202012-05-23%20at%204.58.48%20PM.png)


# Edit Posts

Once the file has been loaded, all you have to do is pointing your cursor to the text and start typing. We're providing basic syntax highlighting for Markdown to assist you during the writing process.

![Edit](http://f.cl.ly/items/3E0Q2K3V0M3z1O2j1r1H/Screen%20Shot%202012-05-22%20at%201.53.28%20AM.png)


# Preview

You can instantly preview your writing by either clicking the preview icon at the document menu bar, or `ctrl+shift+right` to toggle it.

![Preview](http://f.cl.ly/items/1t2I3s2o0s3D2u1E270x/Screen%20Shot%202012-05-23%20at%205.03.29%20PM.png)


# Cheatsheet

If you don't write on a daily basis (like me) you might have difficulties to remember the Markdown syntax so we also included a cheatsheet that you can use for reference. You reach it by pressing `ctrl+shift+left`.

![Preview](http://f.cl.ly/items/1t2I3s2o0s3D2u1E270x/Screen%20Shot%202012-05-23%20at%205.03.29%20PM.png)


# Publish

Once you are ready, you can easily publish your article, which lets it show up on the actual webpage/blog. Try it.

![Publish](http://f.cl.ly/items/302m2R2l0x090h0k0s21/Screen%20Shot%202012-05-23%20at%205.03.43%20PM.png)


# Metadata

Take full control about your post, and edit Metadata aka the YAML frontmatter. No limitations.

![Repositories](http://f.cl.ly/items/1v0a3E0C1Z3z2s3N473v/Screen%20Shot%202012-05-23%20at%205.04.01%20PM.png)


# Not just for Jekyll

The editor not only supports Jekyll websites but can be used to edit any github repository (respectively any contained text file). You can use it to edit `server.js` of your Node.js application for instance. 

![Using the editor for source code](http://f.cl.ly/items/3p2a0a3C3A1I0c3n2o21/Screen%20Shot%202012-06-12%20at%203.12.12%20PM.png)

However, if navigate to a Jekyll repository, the editor is smart enough to expose everything below `_posts` and provide a the metadata editor along with the markdown preview panel.

# Suitable for writers

Prose is also suitable as a full-featured writing environment, covering authoring and sharing articles. That's how you can do it:

1. Create a new github repository. And call it... `documents`.
2. Open the editor and create `hello-world.md`.
3. Save it.
4. Share it (we support deep linking to the rendered version)

Prose is similiar to [iAWriter](http://www.iawriter.com/) as it is also using a minimal interface for editing Markdown, but it's web-based and uses [Github](http://github.com) for storing your text so your writings are more than save and Github keeps a history of every saved version. So Prose can potentially be seen as a whole new way of sharing documents online, while utilizing the usual suspects Markdown and Github. Oh and it's free and open source.


