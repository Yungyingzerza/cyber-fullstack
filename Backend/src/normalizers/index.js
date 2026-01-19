import { FirewallNormalizer } from "./firewall.normalizer.js";
import { NetworkNormalizer } from "./network.normalizer.js";
import { ApiNormalizer } from "./api.normalizer.js";
import { CrowdStrikeNormalizer } from "./crowdstrike.normalizer.js";
import { AwsNormalizer } from "./aws.normalizer.js";
import { M365Normalizer } from "./m365.normalizer.js";
import { AdNormalizer } from "./ad.normalizer.js";

const normalizers = [
  new FirewallNormalizer(),
  new NetworkNormalizer(),
  new ApiNormalizer(),
  new CrowdStrikeNormalizer(),
  new AwsNormalizer(),
  new M365Normalizer(),
  new AdNormalizer(),
];

const normalizerMap = {
  firewall: new FirewallNormalizer(),
  network: new NetworkNormalizer(),
  api: new ApiNormalizer(),
  crowdstrike: new CrowdStrikeNormalizer(),
  aws: new AwsNormalizer(),
  m365: new M365Normalizer(),
  ad: new AdNormalizer(),
};

export function getNormalizer(source) {
  return normalizerMap[source] || null;
}

export function detectNormalizer(data) {
  if (typeof data === "string") {
    for (const normalizer of normalizers) {
      if (normalizer.canHandle(data)) {
        return normalizer;
      }
    }
    return normalizerMap.firewall;
  }

  if (data.source && normalizerMap[data.source]) {
    return normalizerMap[data.source];
  }

  for (const normalizer of normalizers) {
    if (normalizer.canHandle(data)) {
      return normalizer;
    }
  }

  return normalizerMap.api;
}

export function normalize(data, tenantId) {
  const normalizer = detectNormalizer(data);
  return normalizer.normalize(data, tenantId);
}

export {
  FirewallNormalizer,
  NetworkNormalizer,
  ApiNormalizer,
  CrowdStrikeNormalizer,
  AwsNormalizer,
  M365Normalizer,
  AdNormalizer,
};
