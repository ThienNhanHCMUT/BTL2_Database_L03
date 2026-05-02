import { apiContractPath, requestJson } from './api';

export const EVENT_API_CONTRACT = {
  list: {
    method: 'GET',
    path: apiContractPath('/events'),
    sql: 'usp_Event_List',
  },
  create: {
    method: 'POST',
    path: apiContractPath('/events'),
    sql: 'usp_Event_Insert',
  },
  update: {
    method: 'PUT',
    path: apiContractPath('/events/:eventId'),
    sql: 'usp_Event_Update',
  },
  delete: {
    method: 'DELETE',
    path: apiContractPath('/events/:eventId'),
    sql: 'usp_Event_Delete',
  },
  metrics: {
    method: 'GET',
    path: apiContractPath('/events/:eventId/metrics'),
    sql: [
      'fn_Event_TotalConfirmedRentalFee',
      'fn_Event_CapacityCoverageLabel',
    ],
  },
  organizerSummary: {
    method: 'GET',
    path: apiContractPath('/event-organizer-summary'),
    sql: 'usp_Organizer_Event_Summary',
  },
};

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });

  return query.toString();
}

function toDateInput(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function readList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.recordset)) return data.recordset;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
}

function readSingle(data) {
  if (Array.isArray(data)) return data[0] ?? null;
  if (Array.isArray(data?.data)) return data.data[0] ?? null;
  if (Array.isArray(data?.recordset)) return data.recordset[0] ?? null;
  return data?.data ?? data ?? null;
}

export function normalizeEvent(event) {
  if (!event) return null;

  return {
    eventId: event.eventId ?? event.EventID ?? '',
    organizerId: event.organizerId ?? event.OrganizerID ?? '',
    eventName: event.eventName ?? event.EventName ?? '',
    eventDesc: event.eventDesc ?? event.EventDesc ?? '',
    eventStartDate: toDateInput(event.eventStartDate ?? event.EventStartDate),
    eventEndDate: toDateInput(event.eventEndDate ?? event.EventEndDate),
    expectedScale: Number(event.expectedScale ?? event.ExpectedScale ?? 0),
    totalBudget: Number(event.totalBudget ?? event.TotalBudget ?? 0),
    eventStatus: event.eventStatus ?? event.EventStatus ?? '',
    confirmedSessionCount: Number(
      event.confirmedSessionCount ?? event.ConfirmedSessionCount ?? 0
    ),
    orgName: event.orgName ?? event.OrgName ?? '',
    organizerType: event.organizerType ?? event.OrganizerType ?? '',
  };
}

export function mapEventFormToPayload(form) {
  return {
    EventID: String(form.eventId ?? '').trim(),
    OrganizerID: String(form.organizerId ?? '').trim(),
    EventName: String(form.eventName ?? '').trim(),
    EventDesc: String(form.eventDesc ?? '').trim() || null,
    EventStartDate: form.eventStartDate,
    EventEndDate: form.eventEndDate,
    ExpectedScale: Number(form.expectedScale),
    TotalBudget: form.totalBudget === '' ? 0 : Number(form.totalBudget),
    EventStatus: form.eventStatus,
  };
}

export async function fetchEvents(filters = {}) {
  const query = buildQuery({
    Keyword: filters.keyword,
    EventStatus: filters.eventStatus,
    FromDate: filters.fromDate,
    ToDate: filters.toDate,
  });
  const path = `${EVENT_API_CONTRACT.list.path}${query ? `?${query}` : ''}`;
  const data = await requestJson(path);

  return readList(data).map(normalizeEvent).filter(Boolean);
}

export async function createEvent(payload) {
  const data = await requestJson(EVENT_API_CONTRACT.create.path, {
    method: EVENT_API_CONTRACT.create.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return normalizeEvent(readSingle(data));
}

export async function updateEvent(eventId, payload) {
  const path = apiContractPath(`/events/${encodeURIComponent(eventId)}`);
  const data = await requestJson(path, {
    method: EVENT_API_CONTRACT.update.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return normalizeEvent(readSingle(data));
}

export async function deleteEvent(eventId) {
  const path = apiContractPath(`/events/${encodeURIComponent(eventId)}`);

  return requestJson(path, {
    method: EVENT_API_CONTRACT.delete.method,
  });
}

export function normalizeEventMetrics(metrics, eventId = '') {
  if (!metrics) return null;

  return {
    eventId: metrics.eventId ?? metrics.EventID ?? eventId,
    totalConfirmedRentalFee: Number(
      metrics.totalConfirmedRentalFee ??
        metrics.TotalConfirmedRentalFee ??
        metrics.fn_Event_TotalConfirmedRentalFee ??
        0
    ),
    capacityCoverageLabel:
      metrics.capacityCoverageLabel ??
      metrics.CapacityCoverageLabel ??
      metrics.fn_Event_CapacityCoverageLabel ??
      '',
  };
}

export async function fetchEventMetrics(eventId) {
  const path = apiContractPath(`/events/${encodeURIComponent(eventId)}/metrics`);
  const data = await requestJson(path);

  return normalizeEventMetrics(readSingle(data), eventId);
}

export function normalizeOrganizerEventSummary(row) {
  if (!row) return null;

  return {
    organizerId: row.organizerId ?? row.OrganizerID ?? '',
    orgName: row.orgName ?? row.OrgName ?? '',
    organizerType: row.organizerType ?? row.OrganizerType ?? '',
    eventCount: Number(row.eventCount ?? row.EventCount ?? 0),
    totalPlannedBudget: Number(row.totalPlannedBudget ?? row.TotalPlannedBudget ?? 0),
    totalConfirmedRentalFee: Number(
      row.totalConfirmedRentalFee ?? row.TotalConfirmedRentalFee ?? 0
    ),
    totalConfirmedSessionCount: Number(
      row.totalConfirmedSessionCount ?? row.TotalConfirmedSessionCount ?? 0
    ),
  };
}

export async function fetchOrganizerEventSummary(filters = {}) {
  const query = buildQuery({
    EventStatus: filters.eventStatus,
    BudgetFloor: filters.budgetFloor,
    MinEventCount: filters.minEventCount,
    MinConfirmedRentalFee: filters.minConfirmedRentalFee,
  });
  const path = `${EVENT_API_CONTRACT.organizerSummary.path}${query ? `?${query}` : ''}`;
  const data = await requestJson(path);

  return readList(data).map(normalizeOrganizerEventSummary).filter(Boolean);
}
