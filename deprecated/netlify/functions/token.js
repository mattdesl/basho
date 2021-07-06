const axios = require("axios");
const parse = require("node-html-parser").parse;
const { getKeyValue, json } = require("./util");
const api = "https://api.artblocks.io/token/";

exports.handler = async (event, context) => {
  const qs = event.queryStringParameters;
  let { id } = qs;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "must specify id query parameter",
      }),
    };
  }

  const { data } = await axios.get(`${api}${id}`);

  const artwork = {};
  for (let key in data) {
    const k = key.trim().replace(/\s+/g, "_").toLowerCase();
    const value = data[key];
    artwork[k] = value;

    // if (k === "features") {
    //   artwork[k] = value.reduce((result, feature) => {
    //     const kv = feature.split(":");
    //     result[kv[0]] = (kv[1] || kv[0]).trim();
    //     return result;
    //   }, {});
    // }
  }
  // if (!data.features) {
  //   const description = data.description.split("=> ");
  //   if (description[1]) {
  //     data.features = description[1].split(", ").reduce((result, feature) => {
  //       const kv = feature.split(":");
  //       result[kv[0]] = (kv[1] || kv[0]).trim();
  //       return result;
  //     }, {});
  //     console.log(`Extracted features from description for ${id}`);
  //   } else {
  //     throw new Error("Missing features!");
  //   }
  // }
  delete artwork.traits;
  return json(event, { id, ...artwork });
};
