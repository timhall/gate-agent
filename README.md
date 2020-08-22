# gate-agent

Node.js Agent with HTTP_PROXY, HTTP_PROXY, and NO_PROXY support for node-fetch, got, and others.

## Example

```js
const { GateAgent } = require("gate-agent");
const fetch = require("node-fetch");

const agent = new GateAgent();
const response = await fetch("...", { agent });
```
