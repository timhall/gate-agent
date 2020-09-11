import { ClientRequest, RequestOptions } from "agent-base";
import {
	HttpsProxyAgent as BaseHttpsProxyAgent,
	HttpsProxyAgentOptions,
} from "https-proxy-agent";
import { Socket } from "net";

export { HttpsProxyAgentOptions };

export class HttpsProxyAgent extends BaseHttpsProxyAgent {
	async callback(
		request: ClientRequest,
		requestOptions: RequestOptions
	): Promise<Socket> {
		// Pass proxy options as request options
		// so that they pass through to tls.connect
		//
		// See https://github.com/TooTallNate/node-https-proxy-agent/pull/111
		// for an open resolution

		const { proxy = {} } = this as any;

		const options = {
			// Selection of common options from createSecureContext
			// https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
			ca: proxy.ca,
			key: proxy.key,
			cert: proxy.cert,
			pfx: proxy.pfx,
			passphrase: proxy.passphrase,

			...requestOptions,
		};

		return BaseHttpsProxyAgent.prototype.callback.call(this, request, options);
	}
}
