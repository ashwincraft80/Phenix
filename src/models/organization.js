/**
 * Organization Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export const VERIFICATION_STATUSES = Object.freeze([
  'PENDING',
  'VERIFIED',
  'SUSPENDED',
  'REJECTED'
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9\s\-()]{7,32}$/;

// Indian CIN: L/U + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits (21 chars)
const CIN_REGEX = /^[LUlu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;
// Indian GSTIN: 2 digits + 5 letters + 4 digits + 1 letter + 1 char + Z + 1 char (15 chars)
const GSTIN_REGEX = /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$/;
// General Indian corporate / industrial registration (Udyam, MSME, or CIN/GSTIN)
const GENERAL_REG_REGEX = /^[A-Za-z0-9\-_.]{5,64}$/;

export function isValidRegistrationNumber(regNo) {
  if (typeof regNo !== 'string') return false;
  const trimmed = regNo.trim();
  return CIN_REGEX.test(trimmed) || GSTIN_REGEX.test(trimmed) || GENERAL_REG_REGEX.test(trimmed);
}

export function validateOrganization(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Organization data must be a non-null object');
  }

  const regNo = data.registration_number ?? data.registrationNumber;
  if (!regNo || typeof regNo !== 'string' || !isValidRegistrationNumber(regNo)) {
    throw new ValidationError(
      `Invalid registration number (must be a valid CIN, GSTIN, or alphanumeric code 5-64 chars): ${regNo}`,
      'registration_number'
    );
  }

  const legalName = data.legal_name ?? data.legalName;
  if (!legalName || typeof legalName !== 'string' || legalName.trim().length === 0 || legalName.length > 255) {
    throw new ValidationError('Legal name is required and must be between 1 and 255 characters', 'legal_name');
  }

  const industrialSector = data.industrial_sector ?? data.industrialSector;
  if (!industrialSector || typeof industrialSector !== 'string' || industrialSector.trim().length === 0) {
    throw new ValidationError('Industrial sector is required', 'industrial_sector');
  }

  const verificationStatus = (data.verification_status ?? data.verificationStatus ?? 'PENDING').toUpperCase();
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) {
    throw new ValidationError(
      `Invalid verification status: ${verificationStatus}. Allowed: ${VERIFICATION_STATUSES.join(', ')}`,
      'verification_status'
    );
  }

  const contactEmail = data.contact_email ?? data.contactEmail;
  if (!contactEmail || typeof contactEmail !== 'string' || !EMAIL_REGEX.test(contactEmail.trim())) {
    throw new ValidationError(`Invalid contact email: ${contactEmail}`, 'contact_email');
  }

  const contactPhone = data.contact_phone ?? data.contactPhone;
  if (!contactPhone || typeof contactPhone !== 'string' || !PHONE_REGEX.test(contactPhone.trim())) {
    throw new ValidationError(`Invalid contact phone number: ${contactPhone}`, 'contact_phone');
  }

  const esgScore = Number(data.esg_score ?? data.esgScore ?? 50.0);
  if (isNaN(esgScore) || esgScore < 0.0 || esgScore > 100.0) {
    throw new ValidationError(`ESG score must be a number between 0.0 and 100.0: ${esgScore}`, 'esg_score');
  }

  const reliabilityRating = Number(data.reliability_rating ?? data.reliabilityRating ?? 3.0);
  if (isNaN(reliabilityRating) || reliabilityRating < 0.0 || reliabilityRating > 5.0) {
    throw new ValidationError(`Reliability rating must be a number between 0.0 and 5.0: ${reliabilityRating}`, 'reliability_rating');
  }

  return {
    organization_id: data.organization_id ?? data.organizationId ?? null,
    registration_number: regNo.trim(),
    legal_name: legalName.trim(),
    trade_name: (data.trade_name ?? data.tradeName ?? legalName).trim(),
    industrial_sector: industrialSector.trim(),
    verification_status: verificationStatus,
    contact_email: contactEmail.trim(),
    contact_phone: contactPhone.trim(),
    esg_score: esgScore,
    reliability_rating: reliabilityRating,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString(),
    updated_at: data.updated_at ?? data.updatedAt ?? new Date().toISOString()
  };
}

export class Organization {
  constructor(data) {
    const validated = validateOrganization(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
