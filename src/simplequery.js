const SUBGRAPH = "https://api.thegraph.com/subgraphs/name/artblocks/art-blocks";

// Utility to query from subgraph
async function query(url, query) {
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
}

// Fetches up to 100 owned tokens for the given wallet address
async function fetchTokensOwnedByAddress(ownerAddress, opts = {}) {
  ownerAddress = ownerAddress.toLowerCase();
  const { limit = 100 } = opts;
  const { tokens } = await query(
    SUBGRAPH,
    `{
    tokens(first: ${limit}, orderBy: createdAt, orderDirection: desc, where: { owner: "${ownerAddress}"}) {
      id
      project {
        name
        artistName
      }
    }
  }`
  );
  return tokens;
}

(async () => {
  const tokens = await fetchTokensOwnedByAddress(
    "0xcAb81F14A3Fc98034a05bAb30f8D0E53e978c833"
  );
  console.log(tokens);
})();
