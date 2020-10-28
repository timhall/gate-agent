import { Agent, ClientRequest } from "agent-base";
import _debug from "debug";
import { Agent as HttpAgent, OutgoingHttpHeaders } from "http";
import { HttpProxyAgent } from "http-proxy-agent";
import { Agent as HttpsAgent, AgentOptions } from "https";
import matchUrl from "match-url-wildcard";
import { URL, Url } from "url";
import { HttpsProxyAgent } from "./https-proxy-agent";

const debug = _debug("gate-agent");

export type GateAgentOptions = AgentOptions & {
	headers?: OutgoingHttpHeaders;
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
						...toUrlParse(httpProxy),
						...agentOptions,
				  })
				: undefined,
			httpsProxy: httpsProxy
				? new HttpsProxyAgent({
						...toUrlParse(httpsProxy),
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

function toUrlParse(url: URL): Url {
	return {
		protocol: url.protocol,
		auth:
			url.username || url.password ? `${url.username}:${url.password}` : null,
		host: url.host,
		hostname: url.hostname,
		port: url.port || null,
		path: `${url.pathname}${url.search}`,
		pathname: url.pathname,
		search: url.search || null,
		query: url.search ? url.search.slice(1) : null,
		hash: url.hash || null,
		href: url.href,
		slashes: true,
	};
}
