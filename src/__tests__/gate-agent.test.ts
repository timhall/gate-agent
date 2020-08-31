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

afterEach(() => env.reset());

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
		secureProxy: false,
		host: "localhost:5678",
		path: "/?a=1",
		port: "5678",
	});

	env.reset();

	env.set("http_proxy", "http://localhost:1234");

	agent = new GateAgent();
	expect((agent.agents.httpProxy as any).options).toEqual({
		secureProxy: false,
		host: "localhost:1234",
		path: "/",
		port: "1234",
	});

	env.reset();

	env.set("HTTPS_PROXY", "http://localhost:5678?a=1#bc");

	agent = new GateAgent();
	expect((agent.agents.httpsProxy as any).options).toEqual({
		secureProxy: false,
		host: "localhost:5678",
		path: "/?a=1",
		port: "5678",
	});

	env.reset();

	env.set("https_proxy", "http://localhost:1234");

	agent = new GateAgent();
	expect((agent.agents.httpsProxy as any).options).toEqual({
		secureProxy: false,
		host: "localhost:1234",
		path: "/",
		port: "1234",
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
