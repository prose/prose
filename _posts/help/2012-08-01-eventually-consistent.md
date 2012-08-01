---
layout: default
published: false
---

# Eventually consistent

Most things in life are not perfect. That's also true for your writings. Every writer, journalist or scientist can tell you about it. There will always be room for improvement.

Essentially, there are two ways you can approach this problem:

1. Invest an infinite amount of time into reviewing before getting a supposedly perfect text out of the door.
2. Publish early and contiuously improve your content once it's out, ideally with the help of your readers.

With the latest release of [Prose.io](http://prose.io) we'd like to propose a workflow that assumes content will be **eventually consistent**. Much like in the spirit of Open Source development, we claim that continuously improving content in the open leads to better results than applying the best review process available.

Leveraging collaboration is not a new idea. People have been invited to contribute to published information for a long while. Letters to the editor are as old as newspapers and in the digital world people can respond to articles by leaving a comment.


# Humans need to contribute

You know that feeling, when you read through an online article and an obvious typo is literally jumping at your face. It's disturbing. But it's there. There's nothing you can do about it.

![Read Article](http://farm8.staticflickr.com/7136/7686114380_53c5cc53f0.jpg)


# Removing the hurdles

The most essential problem is that it's pretty hard to get involved. What if you could just put a link next to your article enabling users to contribute to the text directly? With Prose and Jekyll this is now possible.

![Edit in Prose](http://farm9.staticflickr.com/8429/7686113722_2e2044fdff.jpg)


# Suggest a change

Once the user clicked on this link he is able to edit the contents of the article he was just reading.

![Content shown in Prose](http://farm9.staticflickr.com/8426/7686114230_c5bc0b2927.jpg)

Prose requires you to be authenticated with GitHub first, once that is done you will be able to edit that content and send a patch, which looks like this:

![Send patch](http://farm8.staticflickr.com/7277/7686114584_47440d2783.jpg)


# Applying a change

Once a suggestion, a patch has been submitted, the original author gets notified via GitHub. In order to apply that change he has to review the Pull Request that has been created automatically.

![Apply changes](http://farm9.staticflickr.com/8421/7686113582_ae24d9fcd4.jpg)

# The Result

Seconds later the applied fix will be visible on the actual website.

![Voilá](http://farm8.staticflickr.com/7107/7686113394_48d9fb649a.jpg)


# Finally

This article isn't perfect either, help make it better by submitting a [patch](http://prose.io/#developmentseed/developmentseed.github.com/edit/master/_posts/blog-2012/2012-07-31-eventually-consistent.md).