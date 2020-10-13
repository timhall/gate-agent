# gate-agent

Node.js Agent with HTTP_PROXY, HTTPS_PROXY, and NO_PROXY (and their lower-case variants) support for node-fetch, got, and others.

## Example

Use `gate-agent/register` to set the `http` and `https` global agents to `gate-agent`:

```js
require("gate-agent/register");

// ...
```

Create a `gate-agent` instance for explicit usage:

```js
const { GateAgent } = require("gate-agent");
const fetch = require("node-fetch");

const agent = new GateAgent();
const response = await fetch("...", { agent });
```

## API

### `GateAgent`

Options:

- `[httpProxy = process.env.HTTP_PROXY]` - Set proxy for http requests
- `[httpsProxy = process.env.HTTPS_PROXY]` - Set proxy for https and http requests
- `[noProxy = process.env.NO_PROXY]` - Comma-separated list or array of wildcards to not proxy
- `http` or `https` Agent options

### `gate-agent/register`

Create a `GateAgent` instance and assign it to [`http.globalAgent`](https://nodejs.org/api/http.html#http_http_globalagent) and [`https.globalAgent`](https://nodejs.org/api/https.html#https_https_globalagent).
