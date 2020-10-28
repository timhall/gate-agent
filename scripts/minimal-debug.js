const noop = () => {};

const exclude = [];
const include = [];
const namespaces = (process.env.DEBUG || "").split(/[\s,]+/);

for (const namespace of namespaces) {
	if (!namespace) continue;

	const formatted = namespace.replace(/\*/g, ".*?");
	if (formatted[0] === "-") {
		exclude.push(new RegExp(`^${formatted.substr(1)}$`));
	} else {
		include.push(new RegExp(`^${formatted}$`));
	}
}

const isExcluded = (namespace) =>
	exclude.some((regex) => regex.test(namespace));
const isIncluded = (namespace) =>
	include.some((regex) => regex.test(namespace));

module.exports = function minimalDebug(namespace) {
	const enabled = !isExcluded(namespace) && isIncluded(namespace);

	return enabled
		? (...values) => {
				console.log(`[${namespace}]`, ...values);
		  }
		: noop;
};
