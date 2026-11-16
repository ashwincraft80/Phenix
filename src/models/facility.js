/**
 * Facility Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';

const PINCODE_REGEX = /^[1-9][0-9]{5}$|^[A-Za-z0-9\s\-]{3,16}$/;

export function validateFacility(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Facility data must be a non-null object');
  }

  const orgId = data.organization_id ?? data.organizationId;
  if (orgId === undefined || orgId === null || isNaN(Number(orgId)) || Number(orgId) <= 0) {
    throw new ValidationError(`Facility must link to a valid positive organization ID: ${orgId}`, 'organization_id');
  }

  const facilityCode = data.facility_code ?? data.facilityCode;
  if (!facilityCode || typeof facilityCode !== 'string' || facilityCode.trim().length === 0 || facilityCode.length > 64) {
    throw new ValidationError('Facility code is required (1-64 characters)', 'facility_code');
  }

  const facilityName = data.facility_name ?? data.facilityName;
  if (!facilityName || typeof facilityName !== 'string' || facilityName.trim().length === 0 || facilityName.length > 255) {
    throw new ValidationError('Facility name is required (1-255 characters)', 'facility_name');
  }

  const clusterName = data.cluster_name ?? data.clusterName;
  if (!clusterName || typeof clusterName !== 'string' || clusterName.trim().length === 0 || clusterName.length > 150) {
    throw new ValidationError('Cluster name is required (1-150 characters)', 'cluster_name');
  }

  const lat = Number(data.latitude);
  if (isNaN(lat) || !Number.isFinite(lat) || lat < -90.0 || lat > 90.0) {
    throw new ValidationError(`Latitude must be a valid number between -90.0 and +90.0: ${data.latitude}`, 'latitude');
  }

  const lon = Number(data.longitude);
  if (isNaN(lon) || !Number.isFinite(lon) || lon < -180.0 || lon > 180.0) {
    throw new ValidationError(`Longitude must be a valid number between -180.0 and +180.0: ${data.longitude}`, 'longitude');
  }

  const address = data.address;
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new ValidationError('Address is required', 'address');
  }

  const state = data.state;
  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    throw new ValidationError('State is required', 'state');
  }

  const pincode = String(data.pincode ?? '').trim();
  if (!pincode || !PINCODE_REGEX.test(pincode)) {
    throw new ValidationError(`Invalid pincode format: ${pincode}`, 'pincode');
  }

  return {
    facility_id: data.facility_id ?? data.facilityId ?? null,
    organization_id: Number(orgId),
    facility_code: facilityCode.trim(),
    facility_name: facilityName.trim(),
    cluster_name: clusterName.trim(),
    latitude: lat,
    longitude: lon,
    address: address.trim(),
    state: state.trim(),
    pincode: pincode,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString()
  };
}

export class Facility {
  constructor(data) {
    const validated = validateFacility(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
