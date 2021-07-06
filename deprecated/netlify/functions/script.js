const axios = require("axios");
const parse = require("node-html-parser").parse;
const { getKeyValue, json } = require("./util");
const api = "https://api.artblocks.io/generator/";

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

  const { data } = await axios.get(`${api}${id}`, {
    responseType: "text",
  });

  const result = {};

  const reg = /let\s+tokenData\s+=\s+(\{.*\})/;
  const match = data.match(reg);
  const tokenDataStr = match[1];
  const tokenData = JSON.parse(match[1]);
  const prefix = data.slice(0, match.index);
  const suffix = data.slice(match.index + match[0].length);

  // const template = data.replace(reg, '{%tokenData%}')

  // const hashMatch = data.match(/\tokenData.*(\{.*\})/);
  // const hash = hashMatch ? hashMatch[1] : "";
  console.log(prefix);
  console.log("---");
  console.log(tokenData);

  console.log("---");
  console.log(suffix);
  // console.log(data);

  return json(event, {
    prefix,
    tokenData,
    tokenDataScript: match[0],
    suffix,
  });
  // return { statusCode: 200, body: data };
};
