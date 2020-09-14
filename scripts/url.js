const { parse, URL } = require("url");

const simple = "http://google.com";

console.log(simple);
console.log("parse:", parse(simple));
console.log("URL:", new URL(simple));

const complete = "https://user:@sub.example.com:8080/p/a/t/h?query=string#hash";

console.log(complete);
console.log("parse:", parse(complete));
console.log("URL:", new URL(complete));
