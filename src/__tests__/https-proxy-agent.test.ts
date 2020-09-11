import { HttpsProxyAgent as BaseHttpsProxyAgent } from "https-proxy-agent";
import { HttpsProxyAgent } from "../https-proxy-agent";

test("should add ca, key, cert, pfx, and passphrase options", () => {
	BaseHttpsProxyAgent.prototype.callback = jest.fn();

	const agent = new HttpsProxyAgent({
		secureProxy: true,
		host: "localhost",
		path: "",
		port: 1234,
		ca: "cacert.pem",
		key: "server.key",
		cert: "server.pem",
		pfx: "...",
		passphrase: "...",
	});

	const request = {} as any;
	const requestOptions = {} as any;
	agent.callback(request, requestOptions);

	expect(BaseHttpsProxyAgent.prototype.callback).toHaveBeenCalledWith(request, {
		ca: "cacert.pem",
		key: "server.key",
		cert: "server.pem",
		pfx: "...",
		passphrase: "...",
		ALPNProtocols: ["http 1.1"],
	});

	// Check for issues from internal API changes
	delete (agent as any).proxy;
	agent.callback(request, requestOptions);

	expect(BaseHttpsProxyAgent.prototype.callback).toHaveBeenCalledWith(
		request,
		requestOptions
	);
});

test("should handle internal API changes gracefully", () => {
	BaseHttpsProxyAgent.prototype.callback = jest.fn();

	const agent = new HttpsProxyAgent({
		secureProxy: true,
		host: "localhost",
		path: "",
		port: 1234,
		ca: "cacert.pem",
	});

	// Mock internal API changes
	delete (agent as any).proxy;

	const request = {} as any;
	const requestOptions = {} as any;
	agent.callback(request, requestOptions);

	expect(BaseHttpsProxyAgent.prototype.callback).toHaveBeenCalledWith(
		request,
		requestOptions
	);
});
