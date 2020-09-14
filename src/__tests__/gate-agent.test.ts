import { GateAgent } from "../gate-agent";

jest.mock("http-proxy-agent", () => ({
	HttpProxyAgent: class HttpProxyAgent {
		options: any;

		constructor(options: any) {
			this.options = options;
		}
	},
}));

jest.mock("https-proxy-agent", () => ({
	HttpsProxyAgent: class HttpsProxyAgent {
		options: any;

		constructor(options: any) {
			this.options = options;
		}
	},
}));

let previous: { [key: string]: string | undefined } = {};
const env = {
	set(key: string, value?: string) {
		previous[key] = process.env[key];

		if (value != null) {
			process.env[key] = value;
		} else {
			delete process.env[key];
		}
	},
	reset() {
		for (const [key, value] of Object.entries(previous)) {
			if (value != null) {
				process.env[key] = value;
			} else {
				delete process.env[key];
			}
		}

		previous = {};
	},
};

beforeEach(() => {
	env.set("HTTP_PROXY", undefined);
	env.set("http_proxy", undefined);
	env.set("HTTPS_PROXY", undefined);
	env.set("https_proxy", undefined);
	env.set("NO_PROXY", undefined);
	env.set("no_proxy", undefined);
});

afterEach(() => {
	env.reset();
	jest.clearAllMocks();
});

test("should be defined", () => {
	expect(GateAgent).toBeDefined();
});

test("should load proxy values from the environment", () => {
	let agent = new GateAgent();
	expect(agent.agents.httpProxy).toBeUndefined();
	expect(agent.agents.httpsProxy).toBeUndefined();
	expect(agent.noProxy).toEqual([]);

	env.set("HTTP_PROXY", "http://localhost:5678?a=1#bc");

	agent = new GateAgent();
	expect((agent.agents.httpProxy as any).options).toEqual({
		protocol: "http:",
		auth: null,
		host: "localhost:5678",
		hostname: "localhost",
		port: "5678",
		path: "/?a=1",
		pathname: "/",
		search: "?a=1",
		query: "a=1",
		hash: "#bc",
		href: "http://localhost:5678/?a=1#bc",
		slashes: true,
	});

	env.reset();

	env.set("http_proxy", "http://localhost");

	agent = new GateAgent();
	expect((agent.agents.httpProxy as any).options).toEqual({
		protocol: "http:",
		auth: null,
		host: "localhost",
		hostname: "localhost",
		port: null,
		path: "/",
		pathname: "/",
		search: null,
		query: null,
		hash: null,
		href: "http://localhost/",
		slashes: true,
	});

	env.reset();

	env.set("HTTPS_PROXY", "http://localhost:5678?a=1#bc");

	agent = new GateAgent();
	expect((agent.agents.httpsProxy as any).options).toEqual({
		protocol: "http:",
		auth: null,
		host: "localhost:5678",
		hostname: "localhost",
		port: "5678",
		path: "/?a=1",
		pathname: "/",
		search: "?a=1",
		query: "a=1",
		hash: "#bc",
		href: "http://localhost:5678/?a=1#bc",
		slashes: true,
	});

	env.reset();

	env.set("https_proxy", "http://user:pass@localhost");

	agent = new GateAgent();
	expect((agent.agents.httpsProxy as any).options).toEqual({
		protocol: "http:",
		auth: "user:pass",
		host: "localhost",
		hostname: "localhost",
		port: null,
		path: "/",
		pathname: "/",
		search: null,
		query: null,
		hash: null,
		href: "http://user:pass@localhost/",
		slashes: true,
	});

	env.reset();

	env.set("NO_PROXY", ".a.com,.b.com");

	agent = new GateAgent();
	expect(agent.noProxy).toEqual([".a.com", ".b.com"]);

	env.reset();

	env.set("no_proxy", ".a.com,.b.com");

	agent = new GateAgent();
	expect(agent.noProxy).toEqual([".a.com", ".b.com"]);
});

test("should throw for invalid httpProxy option", () => {
	expect(() => new GateAgent({ httpProxy: "invalid" })).toThrow(
		'Invalid url "invalid" for httpProxy'
	);
});

test("should warn for invalid HTTP_PROXY", () => {
	jest.spyOn(global.console, "warn").mockImplementation();

	env.set("HTTP_PROXY", "invalid");

	const agent = new GateAgent();

	expect(console.warn).toHaveBeenCalledWith(
		'[gate-agent] Invalid url "invalid" for httpProxy, skipping http proxy'
	);
});

test("should throw for invalid httpsProxy option", () => {
	expect(
		() =>
			new GateAgent({
				httpProxy: "http://localhost:1234",
				httpsProxy: "invalid",
			})
	).toThrow('Invalid url "invalid" for httpsProxy');
});

test("should warn for invalid HTTPS_PROXY", () => {
	jest.spyOn(global.console, "warn").mockImplementation();

	env.set("HTTPS_PROXY", "invalid");

	const agent = new GateAgent();

	expect(console.warn).toHaveBeenCalledWith(
		'[gate-agent] Invalid url "invalid" for httpsProxy, skipping https proxy'
	);
});

test("callback should pick agent based on protocol and no proxy (>=14)", () => {
	const agent = new GateAgent({
		httpProxy: "http://localhost:1234",
		httpsProxy: "http://localhost:5678",
		noProxy: ["google.com"],
	});

	expect(
		agent.callback({
			protocol: "https:",
			host: "github.com",
			path: "timhall/gate-agent",
		} as any)
	).toBe(agent.agents.httpsProxy);

	expect(
		agent.callback({
			protocol: "http:",
			host: "github.com",
			path: "timhall/gate-agent",
		} as any)
	).toBe(agent.agents.httpProxy);

	expect(
		agent.callback({
			protocol: "https:",
			host: "google.com",
		} as any)
	).toBe(agent.agents.https);

	expect(
		agent.callback({
			protocol: "http:",
			host: "google.com",
		} as any)
	).toBe(agent.agents.http);
});

test("callback should pick agent based on protocol and no proxy (<=12)", () => {
	const agent = new GateAgent({
		httpProxy: "http://localhost:1234",
		httpsProxy: "http://localhost:5678",
		noProxy: ["google.com"],
	});

	expect(
		agent.callback({
			agent: { protocol: "https:" },
			getHeader: () => "github.com",
			path: "timhall/gate-agent",
		} as any)
	).toBe(agent.agents.httpsProxy);

	expect(
		agent.callback({
			agent: { protocol: "http:" },
			getHeader: () => "github.com",
			path: "timhall/gate-agent",
		} as any)
	).toBe(agent.agents.httpProxy);

	expect(
		agent.callback({
			agent: { protocol: "https:" },
			getHeader: () => "google.com",
		} as any)
	).toBe(agent.agents.https);

	expect(
		agent.callback({
			agent: { protocol: "http:" },
			getHeader: () => "google.com",
		} as any)
	).toBe(agent.agents.http);
});

test("callback should pick agent based on protocol and no proxy (fallback)", () => {
	const agent = new GateAgent({
		httpProxy: "http://localhost:1234",
		httpsProxy: "http://localhost:5678",
		noProxy: ["google.com"],
	});

	expect(
		agent.callback({
			getHeader: () => "",
			path: "local",
		} as any)
	).toBe(agent.agents.httpsProxy);
});

test("should fallback to https agent for missing https proxy", () => {
	const agent = new GateAgent({
		httpProxy: "http://localhost:1234",
		noProxy: ["google.com"],
	});

	expect(
		agent.callback({
			protocol: "https:",
			host: "github.com",
			path: "timhall/gate-agent",
		} as any)
	).toBe(agent.agents.https);
});

test("should use http_proxy -> https_proxy -> http agent for http requests", () => {
	const request = {
		protocol: "http:",
		host: "github.com",
		path: "timhall/gate-agent",
	} as any;

	let agent = new GateAgent({
		httpProxy: "http://localhost:1234",
		noProxy: ["google.com"],
	});

	expect(agent.callback(request)).toBe(agent.agents.httpProxy);

	agent = new GateAgent({
		httpsProxy: "http://localhost:1234",
		noProxy: ["google.com"],
	});

	expect(agent.callback(request)).toBe(agent.agents.httpsProxy);

	agent = new GateAgent();

	expect(agent.callback(request)).toBe(agent.agents.http);
});
