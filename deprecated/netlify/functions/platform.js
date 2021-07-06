const axios = require("axios");
const parse = require("node-html-parser").parse;
const { getKeyValue, json } = require("./util");

const api = "https://api.artblocks.io/platform";

exports.handler = async (event, context) => {
  const { data } = await axios.get(api);
  const body = parse(data).querySelector("body");
  const platform = {};
  body.childNodes.forEach((node, i) => {
    const kv = getKeyValue(node);
    if (kv) {
      platform[kv[0]] = kv[1];
    }
  });

  const list = platform.projects_list || "";
  const projects = list
    .trim()
    .split(",")
    .map((p) => parseInt(p.trim(), 10));
  // platform.projects_list = projects;
  platform.addresses = (platform.address || "").split(",").map((n) => n.trim());
  // platform.next_project_id = parseInt(platform.next_project_id, 10) || 0;
  const nextId = parseInt(platform.next_project_id, 10) || 0;
  platform.project_count = nextId;
  delete platform.address;
  delete platform.next_project_id;
  delete platform.projects_list;
  return json(event, platform);
};
