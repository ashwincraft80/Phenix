/**
 * Exchange Transaction Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';

export const DELIVERY_TERMS = Object.freeze([
  'EXW',
  'FOB',
  'DAP',
  'DDP'
]);

export const TRANSACTION_STATUSES = Object.freeze([
  'CONTRACT_SIGNED',
  'IN_TRANSIT',
  'DELIVERED',
  'INSPECTED_ACCEPTED',
  'SETTLED',
  'DISPUTED',
  'CANCELLED'
]);

export function validateTransaction(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Transaction data must be a non-null object');
  }

  const matchId = data.match_id ?? data.matchId;
  if (matchId === undefined || matchId === null || isNaN(Number(matchId)) || Number(matchId) <= 0) {
    throw new ValidationError(`Valid positive match ID is required: ${matchId}`, 'match_id');
  }

  const contractRef = data.contract_reference ?? data.contractReference;
  if (!contractRef || typeof contractRef !== 'string' || contractRef.trim().length === 0 || contractRef.length > 64) {
    throw new ValidationError('Contract reference is required (1-64 characters)', 'contract_reference');
  }

  const agreedQty = Number(data.agreed_quantity ?? data.agreedQuantity);
  if (isNaN(agreedQty) || agreedQty <= 0) {
    throw new ValidationError(`Agreed quantity must be greater than 0: ${data.agreed_quantity ?? data.agreedQuantity}`, 'agreed_quantity');
  }

  const agreedPrice = Number(data.agreed_price_per_unit_inr ?? data.agreedPricePerUnit ?? data.pricePerUnit ?? 0.0);
  if (isNaN(agreedPrice) || agreedPrice < 0) {
    throw new ValidationError(`Agreed price per unit must be non-negative: ${agreedPrice}`, 'agreed_price_per_unit_inr');
  }

  let totalValue = data.total_transaction_value_inr ?? data.totalTransactionValueINR ?? data.totalValue;
  if (totalValue === undefined || totalValue === null) {
    totalValue = agreedQty * agreedPrice;
  } else {
    totalValue = Number(totalValue);
  }
  if (isNaN(totalValue) || totalValue < 0) {
    throw new ValidationError(`Total transaction value must be non-negative: ${totalValue}`, 'total_transaction_value_inr');
  }

  const deliveryTerms = (data.delivery_terms ?? data.deliveryTerms ?? 'EXW').toUpperCase();
  if (!DELIVERY_TERMS.includes(deliveryTerms)) {
    throw new ValidationError(`Invalid delivery terms: ${deliveryTerms}. Allowed: ${DELIVERY_TERMS.join(', ')}`, 'delivery_terms');
  }

  const status = (data.status ?? 'CONTRACT_SIGNED').toUpperCase();
  if (!TRANSACTION_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid transaction status: ${status}. Allowed: ${TRANSACTION_STATUSES.join(', ')}`, 'status');
  }

  return {
    transaction_id: data.transaction_id ?? data.transactionId ?? null,
    match_id: Number(matchId),
    contract_reference: contractRef.trim(),
    agreed_quantity: agreedQty,
    agreed_price_per_unit_inr: agreedPrice,
    total_transaction_value_inr: totalValue,
    delivery_terms: deliveryTerms,
    logistics_provider: data.logistics_provider ?? data.logisticsProvider ?? null,
    status: status,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString(),
    settled_at: data.settled_at ?? data.settledAt ?? null
  };
}

export class Transaction {
  constructor(data) {
    const validated = validateTransaction(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
