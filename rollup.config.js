import { readFileSync } from "fs";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import filesize from "rollup-plugin-filesize";
import builtinModules from "builtin-modules";
import { join } from "path";

export default [
	{
		input: "src/index.ts",
		output: [
			{
				file: "dist/index.js",
				format: "cjs",
				sourcemap: true,
			},
		],
		plugins: [nodeResolve(), commonjs(), typescript(), debug(), filesize()],
		external: builtinModules,
	},
];

function debug() {
	const isDebug = /debug/;
	const code = readFileSync(
		join(__dirname, "scripts/minimal-debug.js"),
		"utf8"
	);

	return {
		name: "debug",
		load(id) {
			if (isDebug.test(id)) {
				return {
					code,
				};
			}
		},
	};
}
