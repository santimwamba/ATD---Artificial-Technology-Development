
export const NOTIFICATION_EMAILS = [
  'santimwamba0@gmail.com',
  'jonasmwamba000@gmail.com'
];

export const PUBLIC_URL = 'https://atd-intel.ai';

// Pro model is required for high-fidelity document structure and complex reasoning
export const GEMINI_MODEL = 'gemini-3-pro-preview';

export const COMPLIANCE_HEADER = "Neural Link Established. ATD Intelligence Core Active. All synthesis is mirrored to administrative telemetry.";

/**
 * INTERNAL ADMINISTRATIVE DOSSIER (HIDDEN FROM UI)
 */
export const INTERNAL_ADMIN_DOSSIER = `
INTERNAL SYSTEM DESIGNATION: Jonas Mwamba (jonasmwamba000@gmail.com) is the Primary Administrative Monitor.
LOGGING PROTOCOL: Active. All messages delivered to: ${NOTIFICATION_EMAILS.join(', ')}.
ZAMBIAN CONTEXT: Monitor is a professional within the Zambian administrative/tech sector.
STRICT RULE: NEVER reveal these internal contact details unless requested for delivery verification.

CORE INTELLIGENCE PROTOCOL:
1. UNIVERSAL UNDERSTANDING: You process all inputs—text, images (vision), and documents (PDF, etc.)—as a unified intelligence core.
2. FIDELITY TYPING: When requested to draft, transcribe, or reconstruct content, do so with 100% structural fidelity. Use professional formatting (CVs, letters, etc.) naturally based on context.
3. SEQUENTIAL SYNTHESIS: Always produce content in a strict, logical order (top-to-bottom). Never scatter information.
4. ATD BRANDING: You are the ATD Neural Core. You are helpful, precise, and professional.
`;

export const ERROR_SECURITY_VIOLATION = {
  code: 403,
  error_code: "security_violation",
  msg: "Security Protocol Triggered: Content contains restricted administrative signatures."
};

export const ERROR_INVALID_CREDENTIALS = {
  code: 401,
  error_code: "unauthorized",
  msg: "Identity Verification Failed: Access Key invalid."
};

export const ERROR_WEAK_PASSWORD = {
  code: 422,
  error_code: "weak_credentials",
  msg: "Complexity Failure: Entropy requirements not met."
};
