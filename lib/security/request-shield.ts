/**
 * Request Shield — Defense-in-depth utilities to identify and terminate malicious
 * scanning, path traversal attacks, vulnerability probing, and host header tampering.
 */

// Known vulnerability scanners, probes, and sensitive path patterns
const MALICIOUS_PATH_PATTERNS: RegExp[] = [
  // Environment and configuration leaks
  /\.env(\.|$)/i,
  /\.git(\/|$)/i,
  /\.svn(\/|$)/i,
  /\.hg(\/|$)/i,
  /\.aws(\/|$)/i,
  /\.ssh(\/|$)/i,
  /\.DS_Store$/i,
  /web\.config$/i,
  /config\.json$/i,
  /settings\.py$/i,

  // CMS, WordPress, and Admin scan attempts
  /wp-admin/i,
  /wp-login/i,
  /wp-content/i,
  /wp-includes/i,
  /xmlrpc\.php/i,
  /phpmyadmin/i,
  /pma(\/|$)/i,
  /adminer/i,
  /myadmin/i,
  /boaform/i,
  /setup\.cgi/i,

  // Server management & internal diagnostics
  /actuator(\/|$)/i,
  /swagger-ui/i,
  /api-docs/i,
  /solr(\/|$)/i,
  /jenkins(\/|$)/i,
  /cgi-bin/i,

  // System path traversals and file access attempts
  /etc\/passwd/i,
  /bin\/(sh|bash)/i,
  /proc\/self/i,
  /\.\./, // Directory traversal '../'
  /%2e%2e/i, // URL-encoded traversal
  /%252e%252e/i, // Double-encoded traversal
];

/**
 * Checks whether an incoming request path matches known exploit patterns or vulnerability probes.
 */
export function isMaliciousProbe(pathname: string): boolean {
  if (!pathname) return false;

  for (const pattern of MALICIOUS_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a request protocol is HTTPS or should be redirected to HTTPS.
 * Returns true if the request was made over plain HTTP and should be upgraded.
 */
export function shouldEnforceHttps(
  protocolHeader: string | null,
  host: string | null,
  nodeEnv: string = process.env.NODE_ENV || "development"
): boolean {
  if (!host) return false;

  // Never force HTTPS for local development or loopback addresses
  const isLocalDev =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("::1") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("172.16.") ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host.endsWith(".internal");

  if (isLocalDev && nodeEnv !== "production") {
    return false;
  }

  // If behind reverse proxy (Vercel, Cloudflare, AWS, Nginx), check x-forwarded-proto
  if (protocolHeader && protocolHeader.toLowerCase() === "http") {
    return true;
  }

  return false;
}

/**
 * Sanitizes input strings against dangerous control characters and null bytes.
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  // Strip null bytes and non-printable control characters except newline and tab
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}
