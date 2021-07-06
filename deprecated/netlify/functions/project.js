const axios = require("axios");
const parse = require("node-html-parser").parse;
const { getKeyValue, json } = require("./util");
const api = "https://api.artblocks.io/project/";

exports.handler = async (event, context) => {
  const qs = event.queryStringParameters;
  let { id } = qs;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "must specify id query parameter" }),
    };
  }
  id = parseInt(id, 10);
  if (isNaN(id)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "id query parameter is not a number" }),
    };
  }

  const { data } = await axios.get(`${api}${id}`);
  const body = parse(data).querySelector("body");

  let project = {};
  body.childNodes.forEach((node, i) => {
    const kv = getKeyValue(node);
    if (kv) {
      const key = kv[0];
      let value = kv[1];
      if (key === "script_json") {
        try {
          value = JSON.parse(value.trim());
        } catch (err) {
          value = { error: "error parsing script_json" };
        }
      }
      project[key] = value;
    }
  });
  delete project.token_ids;

  if (project.http || project.https) {
    project = {
      name: project.name,
      artist: project.artist,
      description: project.description,
      website: `http${
        project.https ? `s:${project.https}` : `:${project.http}`
      }`,
      ...project,
    };
    delete project.http;
    delete project.https;
  }

  if (!("script" in qs) || qs.script === "false") {
    delete project.script;
  }

  project.paused = project.paused === "true";
  project.active = project.active === "true";
  project.dynamic_asset = project.dynamic_asset === "true";
  project.hashes_generated_per_token =
    project.hashes_generated_per_token === "true";
  if (project.script_ratio)
    project.script_ratio = parseFloat(project.script_ratio);
  project.maximum_invocations = parseInt(project.maximum_invocations, 10);
  project.invocations = parseInt(project.invocations, 10);
  project.price = parseFloat(project.price);

  return json(event, {
    id,
    ...project,
  });
};
