/**
 * hospital.patientlookup.test.js
 *
 * Unit tests for the Emergency Patient Medical History Lookup feature.
 * All Prisma clients and the audit service are mocked so tests run
 * without a real database.
 *
 * NOTE: The controller keeps an in-memory rate-limit Map (10 lookups / 30 min).
 * Each describe block uses a distinct userId so buckets never bleed across groups.
 */

'use strict';

// ─── Mock prisma config ─────────────────────────────────────────────────────
const mockMainDb = {
  donor:       { findUnique: jest.fn(), findMany: jest.fn() },
  bloodSample: { findFirst: jest.fn() },
};
const mockLabDb = {
  labMedicalRecord: { findUnique: jest.fn() },
};

jest.mock('../src/config/prisma', () => ({ mainDb: mockMainDb, labDb: mockLabDb }));

// ─── Mock audit service ──────────────────────────────────────────────────────
// Factory MUST NOT reference outer vars — jest.mock() is hoisted.
jest.mock('../src/shared/services/audit.service', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
}));
// Pull the mocked reference AFTER the mock is registered.
const { logAction: mockLogAction } = require('../src/shared/services/audit.service');

// ─── Import controller AFTER mocks ──────────────────────────────────────────
const {
  patientLookupByFaydaId,
  patientLookupByName,
  getPatientRecord,
  revealPatientPhone,
} = require('../src/modules/hospital/hospital.controller');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeReq(overrides = {}) {
  return { user: { id: 'default-uid' }, query: {}, params: {}, ip: '127.0.0.1', ...overrides };
}
function makeRes() {
  const r = { statusCode: 200, body: null };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json   = (d) => { r.body = d; return r; };
  return r;
}

const SAMPLE_DONOR = {
  fayda_id: 'FAY-12345', name: 'Almaz Tadesse', phone: '+251912345678',
  dob: new Date('1990-05-14'), gender: 'female', blood_type: 'O+',
  address: 'Addis Ababa', health_status: 'healthy', last_donation_date: null,
};
const SAMPLE_BLOOD_SAMPLE = {
  status: 'validated', health_notes: null,
  collected_at: new Date(Date.now() - 30 * 86400000),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLabDb.labMedicalRecord.findUnique.mockResolvedValue(null);
  mockMainDb.bloodSample.findFirst.mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════════════════════════
describe('patientLookupByFaydaId', () => {
  const uid = 'uid-fayda';

  test('found:true on exact match', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(SAMPLE_DONOR);
    const res = makeRes();
    await patientLookupByFaydaId(makeReq({ user: { id: uid }, query: { nationalId: 'FAY-12345' } }), res);
    expect(res.body.found).toBe(true);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].fayda_id).toBe('FAY-12345');
  });

  test('found:false when no record exists', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(null);
    const res = makeRes();
    await patientLookupByFaydaId(makeReq({ user: { id: uid }, query: { nationalId: 'FAY-99999' } }), res);
    expect(res.body.found).toBe(false);
    expect(res.body.message).toMatch(/no donor record/i);
  });

  test('writes PATIENT_LOOKUP_FAYDA audit log', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(SAMPLE_DONOR);
    await patientLookupByFaydaId(makeReq({ user: { id: uid }, query: { nationalId: 'FAY-12345' } }), makeRes());
    expect(mockLogAction).toHaveBeenCalledWith(uid, 'PATIENT_LOOKUP_FAYDA', expect.stringContaining('FAY-12345'), '127.0.0.1');
  });

  test('returns 400 when nationalId missing', async () => {
    const res = makeRes();
    await patientLookupByFaydaId(makeReq({ user: { id: uid }, query: {} }), res);
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('patientLookupByName', () => {
  const uid = 'uid-name';

  test('multiple results for partial name match', async () => {
    mockMainDb.donor.findMany.mockResolvedValue([
      { fayda_id: 'FAY-001', name: 'Almaz Tadesse', dob: new Date('1990-01-01'), gender: 'female', blood_type: 'O+' },
      { fayda_id: 'FAY-002', name: 'Almaz Bekele',  dob: new Date('1985-06-15'), gender: 'female', blood_type: 'A+' },
    ]);
    const res = makeRes();
    await patientLookupByName(makeReq({ user: { id: uid }, query: { fullName: 'Almaz' } }), res);
    expect(res.body.found).toBe(true);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].fayda_id_masked).toBeDefined();
  });

  test('found:false with empty list when no name matches', async () => {
    mockMainDb.donor.findMany.mockResolvedValue([]);
    const res = makeRes();
    await patientLookupByName(makeReq({ user: { id: uid }, query: { fullName: 'ZZZ_nonexistent' } }), res);
    expect(res.body.found).toBe(false);
    expect(res.body.results).toHaveLength(0);
  });

  test('writes PATIENT_LOOKUP_NAME audit log with results_count', async () => {
    mockMainDb.donor.findMany.mockResolvedValue([SAMPLE_DONOR]);
    await patientLookupByName(makeReq({ user: { id: uid }, query: { fullName: 'Almaz' } }), makeRes());
    expect(mockLogAction).toHaveBeenCalledWith(uid, 'PATIENT_LOOKUP_NAME', expect.stringContaining('results_count'), '127.0.0.1');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('getPatientRecord', () => {
  // Each test uses a unique userId to avoid rate-limit bucket cross-contamination.
  let counter = 0;
  const uid = () => `uid-record-${++counter}`;

  test('full summary card — phone masked, raw phone absent', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(SAMPLE_DONOR);
    mockMainDb.bloodSample.findFirst.mockResolvedValue(SAMPLE_BLOOD_SAMPLE);
    const res = makeRes();
    await getPatientRecord(makeReq({ user: { id: uid() }, params: { faydaId: 'FAY-12345' } }), res);
    expect(res.body.fayda_id).toBe('FAY-12345');
    expect(res.body.eligibility.status).toBe('Eligible');
    expect(res.body.screening.status).toBe('Cleared');
    expect(res.body.phone_masked).toBeDefined();
    expect(res.body.phone).toBeUndefined();
  });

  test('No Screening on File when no samples and no lab record', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(SAMPLE_DONOR);
    const res = makeRes();
    await getPatientRecord(makeReq({ user: { id: uid() }, params: { faydaId: 'FAY-12345' } }), res);
    expect(res.body.has_donation_history).toBe(false);
    expect(res.body.screening.status).toBe('No Screening on File');
  });

  test('404 when donor not found', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue(null);
    const res = makeRes();
    await getPatientRecord(makeReq({ user: { id: uid() }, params: { faydaId: 'FAY-99999' } }), res);
    expect(res.statusCode).toBe(404);
  });

  test('Temporarily Deferred when donated within 90 days', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue({ ...SAMPLE_DONOR, last_donation_date: new Date(Date.now() - 30 * 86400000) });
    mockMainDb.bloodSample.findFirst.mockResolvedValue(SAMPLE_BLOOD_SAMPLE);
    const res = makeRes();
    await getPatientRecord(makeReq({ user: { id: uid() }, params: { faydaId: 'FAY-12345' } }), res);
    expect(res.body.eligibility.status).toBe('Temporarily Deferred');
    expect(res.body.eligibility.reason).toMatch(/days remaining/i);
  });

  test('writes PATIENT_RECORD_VIEW audit log', async () => {
    const id = uid();
    mockMainDb.donor.findUnique.mockResolvedValue(SAMPLE_DONOR);
    mockMainDb.bloodSample.findFirst.mockResolvedValue(SAMPLE_BLOOD_SAMPLE);
    await getPatientRecord(makeReq({ user: { id }, params: { faydaId: 'FAY-12345' } }), makeRes());
    expect(mockLogAction).toHaveBeenCalledWith(id, 'PATIENT_RECORD_VIEW', expect.stringContaining('FAY-12345'), '127.0.0.1');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('revealPatientPhone', () => {
  const uid = 'uid-phone';

  test('returns unmasked phone and writes PATIENT_PHONE_REVEAL audit log', async () => {
    mockMainDb.donor.findUnique.mockResolvedValue({ phone: '+251912345678', name: 'Almaz Tadesse' });
    const res = makeRes();
    await revealPatientPhone(makeReq({ user: { id: uid }, params: { faydaId: 'FAY-12345' } }), res);
    expect(res.body.phone).toBe('+251912345678');
    expect(mockLogAction).toHaveBeenCalledWith(uid, 'PATIENT_PHONE_REVEAL', expect.stringContaining('FAY-12345'), '127.0.0.1');
  });
});
