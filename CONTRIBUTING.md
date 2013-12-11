# Contributing to prose

Thanks for thinking of contributing to prose! Whether you are here to report
issues or develop on the project the sections below provide
outlines on how to get started.

## Reporting Issues

Here's a quick list of things to consider before submitting an issue:

* Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/prose/prose/issues/search?q=)
* Write specifically what browser this is reported to be found in
* Write out the steps to replicate the error: when did it happen? What did you expect to happen? What happened instead?
* Please keep bug reports professional and straightforward: trust us, we share your dismay of software breaking.
* For bonus points, [enable web developer extensions](http://macwright.org/enable-web-developer-extensions/) and report the
  Javascript error message.

And when in doubt, be over-descriptive of the bug and how you discovered it.

## Translating

Translations are managed using the
[Transifex](https://www.transifex.com/projects/p/prose/) platform. After
signing up, you can go to [the prose project
page](https://www.transifex.com/projects/p/prose/), select a language and
click *Translate now* to start translating.

Words in brackets, for example `{name}`, should not be translated into a
new language: it's replaced with a place name when prose presents the text. So a
French translation of `"Uploading {file}"` would look like
`"Réviser {file}"`.

The translations for presets consist of the names of presets, labels for
preset fields, and lists of search terms. You do _not_ need to translate the
search terms literally -- use a set of synonyms and related terms appropriate
to the target language, separated by commas.

Translations are licensed under
[BSD](https://github.com/prose/prose/blob/master/LICENCE.md), the same license
as prose.

[prose translation project on
Transifex](https://www.transifex.com/projects/p/prose/)

## Adding New Strings for Translation

Prose translates strings with a `t` function - `t('foo.bar')` translate the key
`foo.bar` into the current language. If you introduce new translatable strings
to prose, only display them in the interface through the `t()` function.

Then, add the new string to `translations/application.yaml`. The translation system,
Transiflex, will automatically detect the change.

Use `make` to build the translations with the local changes.
`make translate` can be used to pull the latest translations from Transifex.

If you run `make translate` you will be warned to include a `transifex.auth` file in the root directory that contains your transifex user details:

  {
      "user": "username",
      "pass": "password"
  }

## Submitting Pull Requests

All pull requests should be proposed to the [master](https://github.com/prose/prose/tree/master) branch. The `gh-pages` branch manages rebuilds to the server. All pull requests should include an update to the version in `package.json` according to [semver](http://semver.org/).

## Deploying
1. `git checkout master && git pull`
2. `git checkout gh-pages && git pull`
3. `git merge master`
4. `npm install`
5. `make clean && make`
6. `git add dist/`
7. `git commit`
8. `git push`
9. `git checkout master`
10.  Tag the release in `master` using `git tag` in the format `vX.Y.Z`
11. Push tag to GitHub using `git push --tags` 

## Building / Installing

prose uses [Browserify](http://browserify.org) with [Make](http://www.gnu.org/software/make/)
to manage dependencies and build. Development also requires you
have [node.js](http://nodejs.org) >= v0.8 installed.

To get started:

1. [Install node.js](http://nodejs.org/). 'Install' will download a package for
your OS.
2. Go to the directory where you have checked out `prose`
3. Run `make install`
4. Run `make`
5. To run prose with authentication locally, a `oauth.json` file is required to the
to the root directory. when you run `make` this file is created automatically. 

__Note__ You should not commit the `oauth.json` file to a remote repo or along with a pull
request.

__Note__ When you authorize the application the public gatekeeper will redirect to prose.io. You can manually set the URL back to your prose instance. Alternatively you can setup your own Gatekeeper instance. 

If you have python handy, from the project root run `python -m SimpleHTTPServer`
to start a server and run the site locally. By default prose will be set up 
on [http://localhost:8000](http://localhost:8000).

For any changes you make to the codebase, you'll need to run `make` to package
code into a minified `prose.min.js` and see changes.

__ProTip:__ You may want to install `watch` so you can run `watch make` without
needing to execute `make` on every change.

## Code Style

### Javascript

We use the [Airbnb style for Javascript](https://github.com/airbnb/javascript) with a few differences:

No aligned `=`, no aligned arguments, spaces are either indents or the 1
space between expressions. No hard tabs, ever. Javascript code should pass
through [JSHint](http://www.jshint.com/) with no warnings.

### CSS & Markup
- Single Quotes
- 2 spaces soft tabs

for CSS, use classes to target elements.

