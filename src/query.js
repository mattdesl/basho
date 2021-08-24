// Thanks to @r4v3n and artblocks-gallery
// https://github.com/r4v3n-art/art-blocks-gallery

// This subgraph seems to have better support for projects & AB contracts
const PROJECT_EXPLORER =
  "https://api.thegraph.com/subgraphs/name/artblocks/art-blocks";

(async () => {
  await fetch("/project/53").then((resp) => {
    console.log(resp);
  });
})();

// Utility to query from subgraph
async function query(url, query) {
  const response = await fetch(url, {
    method: "post",
    // mode: "cors", // no-cors, *cors, same-origin
    // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const result = await response.json();
  if (result.errors) throw new Error(result.errors[0].message);
  return result.data;
}

// Gets all AB tokens held by owner address
async function fetchTokensByOwner(ownerAddress, opt = {}) {
  const { limit = 100 } = opt;
  const lastId = opt.lastId || opt.lastId === 0 ? opt.lastId : "-1";
  ownerAddress = ownerAddress.toLowerCase();
  const { tokens } = await query(
    PROJECT_EXPLORER,
    `{
  tokens(first: ${limit}, orderBy: id, orderDirection: asc, where: {id_gt: "${lastId}", owner: "${ownerAddress}"}) {
    id
    project {
      name
    }
  }
}`
  );
  return tokens;
}

async function fetchOrderedTokensByOwner(ownerAddress, opt = {}) {
  const { limit = 100 } = opt;
  const lastId = opt.lastId || opt.lastId === 0 ? opt.lastId : "-1";
  ownerAddress = ownerAddress.toLowerCase();
  const { tokens } = await query(
    PROJECT_EXPLORER,
    `{
    tokens(orderBy: createdAt, orderDirection: desc, where: { owner: "${ownerAddress}"}) {
      id
      project {
        name
        artistName
        curationStatus
      }
    }
  }`
  );
  return tokens;
}

async function fetchTokensByProject(projectId, opt = {}) {
  const { limit = 100 } = opt;
  const lastId = opt.lastId || opt.lastId === 0 ? opt.lastId : "-1";
  const { projects } = await query(
    PROJECT_EXPLORER,
    `{
  projects(where: {projectId: "53"}) {
      projectId
      name
      artistName
      tokens(first: ${limit}, orderBy: tokenId, orderDirection: asc, where:{tokenId_gt:"${lastId}"}) {
        tokenId
      }
  }
}`
  );
  if (!projects || projects.length <= 0) {
    throw new Error("No tokens available for project " + projectId);
  }
  return projects[0].tokens.map((t) => {
    return {
      id: t.tokenId,
      project: {
        name: projects[0].name,
        id: projects[0].projectId,
        artistName: projects[0].artistName,
      },
    };
  });
}

// Gets AB contracts currently in use and the nextProjectId
async function fetchPlatform() {
  const { contracts } = await query(
    PROJECT_EXPLORER,
    `{
  contracts {
    id
    nextProjectId
  }
}`
  );
  const nextProjectId = contracts.reduce(
    (max, c) => Math.max(max, parseInt(c.nextProjectId, 10)),
    0
  );
  return {
    nextProjectId: String(nextProjectId),
    addresses: contracts.map((c) => c.id),
  };
}

// Gets details about a specific project ID
async function fetchProject(id) {
  const { projects } = await query(
    PROJECT_EXPLORER,
    `{
  projects(where: { id: "${id}" }) {
    id
    name
    scriptJSON
    website
    artistName
    curationStatus
    artistName
    description
    license
    invocations
    maxInvocations
    paused
    currencySymbol
    pricePerTokenInWei
  }
}
`
  );
  if (!projects || projects.length === 0) return null;
  const result = projects[0];
  if (result) {
    result.scriptJSON = JSON.parse(result.scriptJSON);
    if ("aspectRatio" in result.scriptJSON) {
      result.scriptJSON.aspectRatio = parseFloat(result.scriptJSON.aspectRatio);
    }
    result.maxInvocations = parseInt(result.maxInvocations, 10);
    result.pricePerTokenInWei = parseInt(result.pricePerTokenInWei, 10);
    result.invocations = parseInt(result.invocations, 10);
  }
  return result;
}

async function fetchToken(id) {
  const { tokens } = await query(
    PROJECT_EXPLORER,
    `{
  tokens(where: { id: "${id}" }) {
    id
    owner {
      id
    }
    hash
  }
}
`
  );
  if (!tokens || tokens.length === 0) return null;
  if (tokens.length > 1)
    throw new Error("Received multiple tokens for id: " + id);
  const t = tokens[0];
  return {
    id: t.id,
    owner: t.owner.id,
    hash: t.hash,
  };
}

export function wrapCache(fn) {
  return async (...args) => {
    const input = JSON.stringify(args);
    const result = localStorage.getItem(input);
    if (result) {
      try {
        const data = JSON.parse(result);
        console.log("from cache", input, data);
        return data;
      } catch (err) {}
    }
    const output = await fn(...args);
    localStorage.setItem(input, JSON.stringify(output));
    return output;
  };
}

export {
  fetchProject,
  fetchPlatform,
  fetchOrderedTokensByOwner,
  fetchTokensByProject,
  fetchTokensByOwner,
  fetchToken,
  query,
};
