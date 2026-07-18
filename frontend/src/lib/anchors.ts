/**
 * Anchor Discovery Service
 * Fetches and parses stellar.toml files from known anchors
 */

import { KNOWN_ANCHORS } from './constants';
import type { StellarTomlData, TomlCurrency } from '../types/stellar';

// Cache for stellar.toml data
const tomlCache = new Map<string, { data: StellarTomlData; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and parse stellar.toml for a given domain
 */
export async function fetchStellarToml(domain: string): Promise<StellarTomlData | null> {
  // Check cache first
  const cached = tomlCache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://${domain}/.well-known/stellar.toml`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch stellar.toml from ${domain}: ${response.status}`);
      return null;
    }

    const text = await response.text();
    const data = parseToml(text);

    // Cache the result
    tomlCache.set(domain, { data, fetchedAt: Date.now() });
    return data;
  } catch (error) {
    console.warn(`Error fetching stellar.toml from ${domain}:`, error);
    return null;
  }
}

/**
 * Simple TOML parser for stellar.toml fields we care about
 * This is a lightweight parser — for production, use a full TOML library
 */
function parseToml(text: string): StellarTomlData {
  const data: StellarTomlData = {};

  // Parse simple key-value pairs
  const getValue = (key: string): string | undefined => {
    const regex = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm');
    const match = text.match(regex);
    return match?.[1];
  };

  data.transferServer = getValue('TRANSFER_SERVER');
  data.transferServerSep24 = getValue('TRANSFER_SERVER_SEP0024');
  data.directPaymentServer = getValue('DIRECT_PAYMENT_SERVER');
  data.kycServer = getValue('KYC_SERVER');

  // Parse organization documentation
  const orgName = getValue('ORG_NAME');
  const orgDescription = getValue('ORG_DESCRIPTION');
  const orgUrl = getValue('ORG_URL');
  if (orgName || orgDescription || orgUrl) {
    data.documentation = { orgName, orgDescription, orgUrl };
  }

  // Parse [[CURRENCIES]] sections
  const currencies: TomlCurrency[] = [];
  const currencyBlocks = text.split('[[CURRENCIES]]').slice(1);
  for (const block of currencyBlocks) {
    const getBlockValue = (key: string): string | undefined => {
      const regex = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm');
      const match = block.match(regex);
      return match?.[1];
    };
    const getBlockNumber = (key: string): number | undefined => {
      const regex = new RegExp(`^${key}\\s*=\\s*(\\d+)`, 'm');
      const match = block.match(regex);
      return match ? parseInt(match[1], 10) : undefined;
    };

    const code = getBlockValue('code');
    const issuer = getBlockValue('issuer');
    if (code && issuer) {
      currencies.push({
        code,
        issuer,
        displayDecimals: getBlockNumber('display_decimals') ?? 2,
        name: getBlockValue('name') ?? code,
        description: getBlockValue('desc'),
        image: getBlockValue('image'),
      });
    }
  }
  data.currencies = currencies;

  return data;
}

/**
 * Discover all available assets from known anchors
 */
export async function discoverAnchorAssets(): Promise<{
  domain: string;
  name: string;
  currencies: TomlCurrency[];
}[]> {
  const results = await Promise.allSettled(
    KNOWN_ANCHORS.map(async (anchor) => {
      const toml = await fetchStellarToml(anchor.domain);
      return {
        domain: anchor.domain,
        name: anchor.name,
        currencies: toml?.currencies ?? [],
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ domain: string; name: string; currencies: TomlCurrency[] }> =>
      r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((r) => r.currencies.length > 0);
}

/**
 * Get SEP-6 info endpoint data for fee information
 */
export async function getAnchorFeeInfo(
  transferServer: string
): Promise<Record<string, { fee_fixed?: number; fee_percent?: number; min_amount?: number }> | null> {
  try {
    const response = await fetch(`${transferServer}/info`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    return data.deposit || null;
  } catch {
    return null;
  }
}

/**
 * Clear the stellar.toml cache
 */
export function clearTomlCache(): void {
  tomlCache.clear();
}
