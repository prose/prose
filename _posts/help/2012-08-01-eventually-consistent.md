---
layout: help
title: Eventually consistent
descr: Or how continuously improving content in the open beats the best review process.
image: http://prose.io/images/help/cells.png
author_twitter: _mql
author: Michael Aufreiter
prose_link: http://prose.io/#prose/prose/edit/gh-pages/_posts/help/2012-08-01-eventually-consistent.md
categories:
- help
published: true
---

Most things in life are not perfect. That's also true for your writings. Every writer, journalist or scientist can tell you about it. There will always be room for improvement.

Essentially, there are two ways you can approach this problem:

1. Invest an infinite amount of time into reviewing before getting a supposedly perfect text out of the door.
2. Publish early and continuously improve your content once it's out, ideally with the help of your readers.

With the latest release of [Prose.io](http://prose.io) we'd like to propose a workflow that assumes content will be **eventually consistent**. Much like in the spirit of Open Source development, we claim that continuously improving content in the open leads to better results than applying the best review process available.

Leveraging collaboration is not a new idea. People have been invited to contribute to published information for a long while. Letters to the editor are as old as newspapers and in the digital world people can respond to articles by leaving a comment.


## Humans need to contribute

You know that feeling, when you read through an online article and an obvious mitsake is literally jumping at your face. It's disturbing. But it's there. There's nothing you could do about it.

![Read Article](/images/screenshots/eventually-consistent/spotting-error.png)


## Removing the hurdles

The most essential problem is that it's pretty hard to get involved. What if you could just put a link next to your article enabling users to contribute to the text directly? With Prose and Jekyll this is now possible.

![Edit in Prose](/images/screenshots/eventually-consistent/edit-in-prose.png)


## Suggest a change

Once the user clicked on this link he is able to edit the contents of the article he was just reading.

![Content shown in Prose](/images/screenshots/eventually-consistent/prose-document.png)

Prose requires you to be authenticated with GitHub first, once that is done you will be able to edit that content and send a patch, which looks like this:

![Send patch](/images/screenshots/eventually-consistent/send-patch.png)


## Applying a change

Once a suggestion, a patch has been submitted, the original author gets notified via GitHub. In order to apply that change he has to review the Pull Request that has been created automatically.

![Apply changes](/images/screenshots/eventually-consistent/apply-patch.png)

## The Result

Seconds later the applied fix will be visible on the actual website.

![Voilá](/images/screenshots/eventually-consistent/updated-website.png)


## Finally

This article isn't perfect either, help make it better by submitting a [patch](http://prose.io/#prose/prose/edit/gh-pages/_posts/help/2012-08-01-eventually-consistent.md).