function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

function buildServiceUrl(baseUrl: string, defaultPrefix: string, path: string): string {
  const normalizedBase = trimTrailingSlash(baseUrl);
  const normalizedPath = trimLeadingSlash(path);

  if (normalizedBase.includes(defaultPrefix)) {
    return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
  }

  const prefixWithSlash = defaultPrefix.startsWith('/') ? defaultPrefix : `/${defaultPrefix}`;
  return normalizedPath
    ? `${normalizedBase}${prefixWithSlash}/${normalizedPath}`
    : `${normalizedBase}${prefixWithSlash}`;
}

export function buildMembershipServiceUrl(baseUrl: string, path: string): string {
  return buildServiceUrl(baseUrl, '/membership-service/1.0.0', path);
}

export function buildInvoiceServiceUrl(baseUrl: string, path: string): string {
  return buildServiceUrl(baseUrl, '/invoice-service/1.0.0', path);
}
