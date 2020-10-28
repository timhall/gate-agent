/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
import { Agent as HttpsAgent, AgentOptions } from "https";

export declare type GateAgentOptions = AgentOptions & {
	headers?: OutgoingHttpHeaders;
	httpProxy?: string;
	httpsProxy?: string;
	noProxy?: string | string[];
};

export declare class GateAgent extends HttpsAgent {
	constructor(options?: GateAgentOptions);
}
