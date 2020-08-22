# gate-agent

```js
const { GateAgent } = require("gate-agent");
const fetch = require("node-fetch");

const agent = new GateAgent();
const response = await fetch("...", { agent });
```
