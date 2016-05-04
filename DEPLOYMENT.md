[Prose.io](http://prose.io/) is hosted on [Github Pages](https://pages.github.com/) and works with the [Github API](https://developer.github.com/v3/). Work on supporting the Gitlab API is currently in progress.

Since Prose runs entirely on the client, it relies on a [Gatekeeper](https://github.com/prose/gatekeeper) to authenticate with the Github API.

### Setting up your own Gatekeeper instance

1. [Register your application](https://github.com/settings/applications/new). Set `Homepage URL` and `Authorization callback URL`, for example `http://localhost:3000`. You will get a `GITHUB_APPLICATION_CLIENT_ID` and `GITHUB_APPLICATION_CLIENT_SECRET`.

2. Using your new client ID and secret, follow the steps at the [Gatekeeper repo](https://github.com/prose/gatekeeper#setup-your-gatekeeper) to install and serve Gatekeeper locally, or deploy to [Heroku](https://github.com/prose/gatekeeper#deploy-on-heroku) or [Azure](https://github.com/prose/gatekeeper#deploy-on-azure).
