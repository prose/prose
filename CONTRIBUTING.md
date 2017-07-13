# Contributing to prose

Thanks for thinking of contributing to prose! Whether you are here to report
issues or develop on the project the sections below provide
outlines on how to get started.

## Reporting Issues

Here's a quick list of things to consider before submitting an issue:

* Please [search for your issue before filing it: many bugs and improvements have already been reported](https://github.com/prose/prose/issues)
* Write specifically what browser this is reported to be found in
* Write out the steps to replicate the error: when did it happen? What did you expect to happen? What happened instead?
* Please keep bug reports professional and straightforward: trust us, we share your dismay of software breaking.
* For bonus points, [enable web developer extensions](http://debugbrowser.com) and report the
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
Transifex, will automatically detect the change.

Use `npm` to build the translations with the local changes.
`npm run translations` can be used to pull the latest translations from Transifex.

If you run `npm run translations` you will be warned to include a `transifex.auth` file in the `translations` directory that contains your Transifex user details:

  {
      "user": "username",
      "pass": "password"
  }

## Submitting Pull Requests

All pull requests should be proposed to the [master](https://github.com/prose/prose/tree/master) branch. Pull requests should ideally include unit tests that confirm a bug or new feature. Prose uses the `mocha` testing framework along with `chai` and `sinon`.

## Deploying

[Travis-ci](https://travis-ci.org/) handles deployment to `gh-pages`, and will deploy on each push to the `master` branch.

## Building / Installing

Prose uses [Browserify](http://browserify.org) with [Gulp](http://gulpjs.com/)
to manage dependencies and build. Development also requires you
have [node.js](http://nodejs.org) >= v4.2 installed.

### Prerequisites
- [node.js](http://nodejs.org/).

### Install steps

1. `git clone git@github.com:prose/prose.git && cd prose/`
2. Run `npm i`
3. To run prose with authentication locally, a `oauth.json` file is required in the
root directory. npm will handle this for you with the `gulp` postinstall script.
4. Run `npm start` By default, prose will be set up on [http://localhost:3000](http://localhost:3000).

__Note:__ You should not commit the `oauth.json` file to a remote repo or along with a pull
request.

__Note:__ When you authorize the application the public gatekeeper will redirect
to prose.io with a path that looks something like `http://prose.io/?code=36f237f41bd81c1a3661`. The code
param represents the auth string. You can manually set the URL back to your prose instance.

    Change
    http://prose.io/?code=36f237f41bd81c1a3661

    Back to
    http://localhost:3000/?code=36f237f41bd81c1a3661

Alternatively you can setup your own Gatekeeper instance. For any changes you make
to the codebase, you'll need to run `npm run build` to package code into a minified `prose.min.js`
and see changes.

__ProTip:__ You may want to run `npm run start` to serve the site and allow the running of gulp on every change.

## Testing

Running `npm run test` will also build the browser tests available at http://localhost:8000/test

You can run tests quickly from the command line with `npm test`

Create tests in the `test/spec/` directory. If possible try to mirror the `app` directory structure.
Require any new test files in `test/index.js`

## Notes on debugging

If Chrome DevTools' console reports an error and then points to an unrelated source location, the source map system might be getting confused. If you're working with an unminified `prose.js`, you can simply [disable source maps](https://developer.chrome.com/devtools/docs/javascript-debugging#source-maps).

## Code Style

### Javascript

We use the [Airbnb style for Javascript](https://github.com/airbnb/javascript) with a few differences:

No aligned `=`, no aligned arguments, spaces are either indents or the 1
space between expressions. No hard tabs, ever. Javascript code should pass
through [JSHint](http://www.jshint.com/) with no warnings.

### CSS & Markup
- Single Quotes
- 2 spaces soft tabs

For CSS, use classes to target elements.
