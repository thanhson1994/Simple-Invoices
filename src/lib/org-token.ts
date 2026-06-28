import { getAccessToken, getOrgToken, setOrgTokenCookie } from '@/lib/cookies';
import { buildMembershipServiceUrl } from '@/lib/service-url';

interface UserProfileResponse {
  memberships?: Array<{
    token?: string;
  }>;
  data?: {
    memberships?: Array<{
      token?: string;
    }>;
  };
}

function extractMembershipValue(payload: UserProfileResponse): string | undefined {
  const candidates = [
    ...(payload.memberships || []),
    ...(payload.data?.memberships || []),
  ];

  for (const membership of candidates) {
    const value =
      membership.token ||
      (membership as { orgToken?: string }).orgToken ||
      (membership as { organisationId?: string }).organisationId ||
      (membership as { organizationId?: string }).organizationId ||
      (membership as { orgId?: string }).orgId;

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function buildMembershipV12Url(baseUrl: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');

  if (normalizedBase.includes('/membership-service/1.2.0')) {
    return `${normalizedBase}/users/me/membership`;
  }

  if (normalizedBase.includes('/membership-service/1.0.0')) {
    const v12Base = normalizedBase.replace('/membership-service/1.0.0', '/membership-service/1.2.0');
    return `${v12Base}/users/me/membership`;
  }

  return `${normalizedBase}/membership-service/1.2.0/users/me/membership`;
}

/**
 * Ensure org token exists by fetching current user profile when needed.
 */
export async function ensureOrgToken(options?: {
  forceProfileLookup?: boolean;
}): Promise<string | undefined> {
  const existingOrgToken = await getOrgToken();
  if (existingOrgToken && !options?.forceProfileLookup) {
    return existingOrgToken;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return existingOrgToken;
  }

  const membershipServiceUrl = process.env.MEMBERSHIP_SERVICE_URL;
  if (!membershipServiceUrl) {
    return existingOrgToken;
  }

  try {
    const url = buildMembershipServiceUrl(membershipServiceUrl, 'users/me');
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Operation-Mode': 'SYNC',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return existingOrgToken;
    }

    const data = (await response.json()) as UserProfileResponse;
    let orgToken = extractMembershipValue(data);

    // Fallback for tenants where memberships are exposed under users/me/membership (v1.2.0).
    if (!orgToken) {
      const membershipV12Url = buildMembershipV12Url(membershipServiceUrl);
      const membershipResponse = await fetch(membershipV12Url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Operation-Mode': 'SYNC',
        },
        cache: 'no-store',
      });

      if (membershipResponse.ok) {
        const membershipData = (await membershipResponse.json()) as UserProfileResponse;
        orgToken = extractMembershipValue(membershipData);
      }
    }

    const resolvedOrgToken = orgToken || existingOrgToken;
    if (resolvedOrgToken) {
      await setOrgTokenCookie(resolvedOrgToken);
    }

    return resolvedOrgToken;
  } catch (error) {
    console.error('ensureOrgToken failed:', error);
    return existingOrgToken;
  }
}
