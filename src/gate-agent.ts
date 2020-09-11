import { Agent, ClientRequest } from "agent-base";
import _debug from "debug";
import { Agent as HttpAgent } from "http";
import { HttpProxyAgent } from "http-proxy-agent";
import { Agent as HttpsAgent, AgentOptions } from "https";
import matchUrl from "match-url-wildcard";
import { URL } from "url";
import { HttpsProxyAgent, HttpsProxyAgentOptions } from "./https-proxy-agent";

const debug = _debug("gate-agent");

export type GateAgentOptions = AgentOptions &
	Pick<HttpsProxyAgentOptions, "headers"> & {
		httpProxy?: string;
		httpsProxy?: string;
		noProxy?: string | string[];
	};

type FutureOrInternalRequest = ClientRequest & {
	// v14.5.0+
	protocol?: string;
	host?: string;

	// Internal API in at least v12.x.x
	agent?: {
		protocol?: string;
	};
};

export class GateAgent extends Agent {
	noProxy: string[];
	agents: {
		http: HttpAgent;
		https: HttpsAgent;
		httpProxy?: HttpProxyAgent;
		httpsProxy?: HttpsProxyAgent;
	};

	constructor(options: GateAgentOptions = {}) {
		super();

		const {
			httpProxy: rawHttpProxy = process.env.HTTP_PROXY ||
				process.env.http_proxy,
			httpsProxy: rawHttpsProxy = process.env.HTTPS_PROXY ||
				process.env.https_proxy,
			noProxy = process.env.NO_PROXY || process.env.no_proxy,
			...agentOptions
		} = options;

		let httpProxy;
		try {
			httpProxy = rawHttpProxy ? new URL(rawHttpProxy) : undefined;
		} catch (error) {
			const message = `Invalid url "${rawHttpProxy}" for httpProxy`;

			if (options.httpProxy) {
				throw new Error(message);
			} else {
				console.warn(`[gate-agent] ${message}, skipping http proxy`);
			}
		}

		let httpsProxy;
		try {
			httpsProxy = rawHttpsProxy ? new URL(rawHttpsProxy) : undefined;
		} catch (error) {
			const message = `Invalid url "${rawHttpsProxy}" for httpsProxy`;

			if (options.httpProxy) {
				throw new Error(message);
			} else {
				console.warn(`[gate-agent] ${message}, skipping https proxy`);
			}
		}

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
			httpProxy: httpProxy
				? new HttpProxyAgent({
						secureProxy: httpProxy.protocol === "https:",
						host: httpProxy.host,
						path: `${httpProxy.pathname}${httpProxy.search}`,
						port: httpProxy.port || null,
						...agentOptions,
				  })
				: undefined,
			httpsProxy: httpsProxy
				? new HttpsProxyAgent({
						secureProxy: httpsProxy.protocol === "https:",
						host: httpsProxy.host,
						path: `${httpsProxy.pathname}${httpsProxy.search}`,
						port: httpsProxy.port || null,
						...agentOptions,
				  })
				: undefined,
		};
	}

	callback(request: FutureOrInternalRequest) {
		const protocol = request.protocol || request.agent?.protocol || "https:";
		const host = request.host || request.getHeader("host") || "localhost";
		const url = new URL(request.path, `${protocol}//${host}`).toString();

		const isHttps = protocol === "https:";
		const noProxy = matchUrl(url, this.noProxy);

		debug(`${url} - https: ${isHttps}, proxy: ${!noProxy}`);

		if (noProxy) return isHttps ? this.agents.https : this.agents.http;

		return isHttps
			? this.agents.httpsProxy || this.agents.https
			: this.agents.httpProxy || this.agents.httpsProxy || this.agents.http;
	}
}
