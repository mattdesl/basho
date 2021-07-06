module.exports.getKeyValue = (node) => {
  if (node.tagName.toLowerCase() === "pre") {
    return ["script", node.text];
  } else {
    const text = (node.text || "").trim();
    if (!text) return null;
    const delim = text.includes(":") ? ":" : "?";
    const idx = text.indexOf(delim);
    if (idx === -1) return null;
    let key = text.substring(0, idx).trim();
    let value = text.substring(idx + 1).trim();
    if (key) {
      key = key.replace(/\s+/g, "_").toLowerCase();
      value = value.replace(/\s+/g, " ").trim();
      return [key, value];
    }
  }
  return null;
};

module.exports.json = (event, data) => {
  const qs = event.queryStringParameters;
  const pretty = !("pretty" in qs) || qs.pretty !== "false";
  return {
    statusCode: 200,
    body: JSON.stringify(data, null, pretty ? 2 : null),
  };
};
