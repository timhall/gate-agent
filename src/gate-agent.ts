import { Agent, ClientRequest } from "agent-base";
import _debug from "debug";
import { Agent as HttpAgent } from "http";
import { HttpProxyAgent } from "http-proxy-agent";
import { Agent as HttpsAgent, AgentOptions } from "https";
import { HttpsProxyAgent } from "https-proxy-agent";
import matchUrl from "match-url-wildcard";
import { URL } from "url";

const debug = _debug("gate-agent");

export type GateAgentOptions = AgentOptions & {
	httpProxy?: string;
	httpsProxy?: string;
	noProxy?: string | string[];
};

export class GateAgent extends Agent {
	noProxy: string[];
	agents: {
		http: HttpAgent;
		https: HttpsAgent;
		httpProxy?: HttpProxyAgent;
		httpsProxy?: HttpsProxyAgent;
	};

	constructor(options: GateAgentOptions) {
		super();

		const {
			httpProxy = process.env.HTTP_PROXY || process.env.http_proxy,
			httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy,
			noProxy = process.env.NO_PROXY || process.env.no_proxy,
			...agentOptions
		} = options;

		this.noProxy = noProxy
			? typeof noProxy === "string"
				? noProxy.split(",").map((part) => part.trim())
				: noProxy
			: [];

		debug("http_proxy:", httpProxy);
		debug("https_proxy:", httpsProxy);
		debug("no_proxy:", this.noProxy);

		this.agents = {
			http: new HttpAgent(agentOptions),
			https: new HttpsAgent(agentOptions),
			httpProxy: httpProxy ? new HttpProxyAgent(httpProxy) : undefined,
			httpsProxy: httpsProxy ? new HttpsProxyAgent(httpsProxy) : undefined,
		};
	}

	callback(request: ClientRequest) {
		const url = new URL(request.path);
		const isHttps = url.protocol === "https:";
		const noProxy = matchUrl(url.toString(), this.noProxy);

		debug(`${url} - https: ${isHttps}, proxy: ${!noProxy}`);

		if (noProxy) return isHttps ? this.agents.https : this.agents.http;

		return isHttps
			? this.agents.httpsProxy || this.agents.https
			: this.agents.httpProxy || this.agents.httpsProxy || this.agents.http;
	}
}
