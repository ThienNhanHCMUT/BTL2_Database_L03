import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Edit3,
  Filter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  EmptyState,
  ErrorState,
  FieldError,
  LoadingState,
  NoticeBanner,
} from '../components/product/ProductUi';
import { formatCurrencyFull } from '../utils/formatCurrency';
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  mapEventFormToPayload,
  updateEvent,
} from '../services/eventApi';

const EVENT_STATUSES = ['Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã hoàn thành'];

const EMPTY_FORM = {
  eventId: '',
  organizerId: '',
  eventName: '',
  eventDesc: '',
  eventStartDate: '',
  eventEndDate: '',
  expectedScale: '',
  totalBudget: '0',
  eventStatus: 'Chờ duyệt',
};

const EMPTY_FILTERS = {
  keyword: '',
  eventStatus: '',
  fromDate: '',
  toDate: '',
};

const SORT_OPTIONS = [
  { value: 'sql', label: 'Theo ORDER BY của procedure' },
  { value: 'startDateAsc', label: 'Ngày bắt đầu tăng dần' },
  { value: 'startDateDesc', label: 'Ngày bắt đầu giảm dần' },
  { value: 'eventNameAsc', label: 'Tên sự kiện A-Z' },
  { value: 'budgetDesc', label: 'Ngân sách giảm dần' },
  { value: 'confirmedSessionDesc', label: 'Phiên xác nhận giảm dần' },
];

const FIELD_LABELS = {
  eventId: 'Mã sự kiện',
  organizerId: 'Mã nhà tổ chức',
  eventName: 'Tên sự kiện',
  eventDesc: 'Mô tả',
  eventStartDate: 'Ngày bắt đầu',
  eventEndDate: 'Ngày kết thúc',
  expectedScale: 'Quy mô dự kiến',
  totalBudget: 'Tổng ngân sách',
  eventStatus: 'Trạng thái',
};

const FIELD_ERROR_KEYS = {
  EventID: 'eventId',
  eventID: 'eventId',
  OrganizerID: 'organizerId',
  organizerID: 'organizerId',
  EventName: 'eventName',
  EventDesc: 'eventDesc',
  EventStartDate: 'eventStartDate',
  EventEndDate: 'eventEndDate',
  ExpectedScale: 'expectedScale',
  TotalBudget: 'totalBudget',
  EventStatus: 'eventStatus',
};

function toForm(event) {
  if (!event) return { ...EMPTY_FORM };

  return {
    eventId: event.eventId,
    organizerId: event.organizerId,
    eventName: event.eventName,
    eventDesc: event.eventDesc || '',
    eventStartDate: event.eventStartDate || '',
    eventEndDate: event.eventEndDate || '',
    expectedScale: event.expectedScale ? String(event.expectedScale) : '',
    totalBudget: String(event.totalBudget ?? 0),
    eventStatus: event.eventStatus || 'Chờ duyệt',
  };
}

function validateEventForm(form) {
  const errors = {};
  const trimmedEventId = form.eventId.trim();
  const trimmedOrganizerId = form.organizerId.trim();
  const trimmedEventName = form.eventName.trim();
  const expectedScale = Number(form.expectedScale);
  const totalBudget = form.totalBudget === '' ? 0 : Number(form.totalBudget);

  if (!trimmedEventId) {
    errors.eventId = 'Mã sự kiện không được để trống.';
  } else if (trimmedEventId.length > 20) {
    errors.eventId = 'Mã sự kiện tối đa 20 ký tự.';
  }

  if (!trimmedOrganizerId) {
    errors.organizerId = 'Mã nhà tổ chức không được để trống.';
  } else if (trimmedOrganizerId.length > 20) {
    errors.organizerId = 'Mã nhà tổ chức tối đa 20 ký tự.';
  }

  if (!trimmedEventName) {
    errors.eventName = 'Tên sự kiện không được để trống.';
  } else if (trimmedEventName.length > 200) {
    errors.eventName = 'Tên sự kiện tối đa 200 ký tự.';
  }

  if (!form.eventStartDate || !form.eventEndDate) {
    errors.eventStartDate = 'Ngày bắt đầu và ngày kết thúc là bắt buộc.';
    errors.eventEndDate = 'Ngày bắt đầu và ngày kết thúc là bắt buộc.';
  } else if (form.eventEndDate < form.eventStartDate) {
    errors.eventEndDate = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
  }

  if (form.expectedScale === '') {
    errors.expectedScale = 'Quy mô dự kiến không được để trống.';
  } else if (!Number.isInteger(expectedScale) || expectedScale <= 0) {
    errors.expectedScale = 'Quy mô dự kiến phải là số nguyên lớn hơn 0.';
  }

  if (Number.isNaN(totalBudget)) {
    errors.totalBudget = 'Tổng ngân sách phải là số hợp lệ.';
  } else if (totalBudget < 0) {
    errors.totalBudget = 'Tổng ngân sách không được âm.';
  }

  if (!EVENT_STATUSES.includes(form.eventStatus)) {
    errors.eventStatus = 'Trạng thái sự kiện không hợp lệ.';
  }

  return errors;
}

function validateEventFilters(filters) {
  const errors = {};

  if (filters.keyword.trim().length > 200) {
    errors.keyword = 'Từ khóa tìm kiếm tối đa 200 ký tự.';
  }

  if (filters.eventStatus && !EVENT_STATUSES.includes(filters.eventStatus)) {
    errors.eventStatus = 'Trạng thái lọc không hợp lệ.';
  }

  if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
    errors.toDate = 'Ngày đến phải lớn hơn hoặc bằng ngày từ.';
  }

  return errors;
}

function sortEvents(events, sortKey) {
  const sorted = [...events];

  if (sortKey === 'startDateAsc') {
    return sorted.sort((a, b) =>
      `${a.eventStartDate}-${a.eventName}`.localeCompare(`${b.eventStartDate}-${b.eventName}`)
    );
  }

  if (sortKey === 'startDateDesc') {
    return sorted.sort((a, b) =>
      `${b.eventStartDate}-${b.eventName}`.localeCompare(`${a.eventStartDate}-${a.eventName}`)
    );
  }

  if (sortKey === 'eventNameAsc') {
    return sorted.sort((a, b) => a.eventName.localeCompare(b.eventName, 'vi'));
  }

  if (sortKey === 'budgetDesc') {
    return sorted.sort((a, b) => b.totalBudget - a.totalBudget);
  }

  if (sortKey === 'confirmedSessionDesc') {
    return sorted.sort((a, b) => b.confirmedSessionCount - a.confirmedSessionCount);
  }

  return sorted;
}

function normalizeFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};

  return Object.entries(fieldErrors).reduce((errors, [key, value]) => {
    const normalizedKey = FIELD_ERROR_KEYS[key] || key.charAt(0).toLowerCase() + key.slice(1);
    errors[normalizedKey] = Array.isArray(value) ? value.join(' ') : String(value);
    return errors;
  }, {});
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

export default function EventManagementPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [filterErrors, setFilterErrors] = useState({});
  const [sortKey, setSortKey] = useState('sql');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const editing = Boolean(editingId);

  const validationErrors = useMemo(() => validateEventForm(form), [form]);
  const formValid = Object.keys(validationErrors).length === 0;

  const displayErrors = useMemo(() => {
    return Object.keys({ ...validationErrors, ...serverErrors }).reduce((errors, key) => {
      if (serverErrors[key] || touched[key] || submitAttempted) {
        errors[key] = serverErrors[key] || validationErrors[key];
      }
      return errors;
    }, {});
  }, [serverErrors, submitAttempted, touched, validationErrors]);

  const sortedEvents = useMemo(() => sortEvents(events, sortKey), [events, sortKey]);

  const loadEvents = async (filtersToUse = activeFilters) => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await fetchEvents(filtersToUse);
      setEvents(data);
    } catch (error) {
      setLoadError(
        getErrorMessage(
          error,
          'Không thể tải danh sách sự kiện từ API contract GET /api/events.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadEvents(EMPTY_FILTERS);
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
    setFilterErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const nextFilters = {
      keyword: filters.keyword.trim(),
      eventStatus: filters.eventStatus,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    };
    const errors = validateEventFilters(nextFilters);

    if (Object.keys(errors).length > 0) {
      setFilterErrors(errors);
      return;
    }

    setFilterErrors({});
    setActiveFilters(nextFilters);
    loadEvents(nextFilters);
  };

  const resetFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setActiveFilters({ ...EMPTY_FILTERS });
    setFilterErrors({});
    loadEvents(EMPTY_FILTERS);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setServerErrors((current) => ({
      ...current,
      [name]: '',
    }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId('');
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
  };

  const selectEventForEdit = (event) => {
    setForm(toForm(event));
    setEditingId(event.eventId);
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!formValid) return;

    try {
      setSubmitting(true);
      setNotice(null);
      setServerErrors({});

      const payload = mapEventFormToPayload(form);
      const savedEvent = editing
        ? await updateEvent(editingId, payload)
        : await createEvent(payload);

      setNotice({
        type: 'success',
        message: editing
          ? `Đã gửi yêu cầu cập nhật sự kiện ${payload.EventID}.`
          : `Đã gửi yêu cầu tạo sự kiện ${payload.EventID}.`,
      });

      await loadEvents();

      if (savedEvent) {
        setForm(toForm(savedEvent));
        setEditingId(savedEvent.eventId);
      } else if (!editing) {
        resetForm();
      }
    } catch (error) {
      setServerErrors(normalizeFieldErrors(error.fieldErrors));
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Không thể lưu sự kiện.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.eventId) return;

    try {
      setDeleteLoading(true);
      await deleteEvent(deleteTarget.eventId);
      setNotice({
        type: 'success',
        message: `Đã gửi yêu cầu xóa sự kiện ${deleteTarget.eventId}.`,
      });
      setDeleteTarget(null);

      if (editingId === deleteTarget.eventId) {
        resetForm();
      }

      await loadEvents();
    } catch (error) {
      setDeleteTarget(null);
      setNotice({
        type: 'error',
        message: getErrorMessage(error, 'Không thể xóa sự kiện.'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <section className="mb-8">
        <div className="flex items-center gap-3 text-primary mb-3">
          <CalendarDays size={22} />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Phần 3.1 / 3.2
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
          Quản lý sự kiện
        </h1>
        <p className="text-gray-400 max-w-3xl">
          Thêm, cập nhật và xóa dữ liệu EVENT qua API contract tương ứng với
          usp_Event_Insert, usp_Event_Update, usp_Event_Delete và truy vấn danh sách
          từ usp_Event_List.
        </p>
      </section>

      <div className="space-y-5">
        {notice ? <NoticeBanner notice={notice} onClose={() => setNotice(null)} /> : null}

        <section className="grid xl:grid-cols-[420px_1fr] gap-6">
          <form
            onSubmit={handleSubmit}
            className="bg-dark-800 border border-white/5 rounded-2xl p-5 h-fit"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editing ? 'Cập nhật sự kiện' : 'Thêm sự kiện'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editing ? `Đang sửa ${editingId}` : 'Tạo bản ghi EVENT mới'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-200 text-sm transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                name="eventId"
                label={FIELD_LABELS.eventId}
                value={form.eventId}
                error={displayErrors.eventId}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={editing}
                required
              />
              <TextField
                name="organizerId"
                label={FIELD_LABELS.organizerId}
                value={form.organizerId}
                error={displayErrors.organizerId}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <TextField
                className="sm:col-span-2"
                name="eventName"
                label={FIELD_LABELS.eventName}
                value={form.eventName}
                error={displayErrors.eventName}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <TextField
                name="eventStartDate"
                label={FIELD_LABELS.eventStartDate}
                type="date"
                value={form.eventStartDate}
                error={displayErrors.eventStartDate}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <TextField
                name="eventEndDate"
                label={FIELD_LABELS.eventEndDate}
                type="date"
                value={form.eventEndDate}
                error={displayErrors.eventEndDate}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <TextField
                name="expectedScale"
                label={FIELD_LABELS.expectedScale}
                type="number"
                min="1"
                step="1"
                value={form.expectedScale}
                error={displayErrors.expectedScale}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              <TextField
                name="totalBudget"
                label={FIELD_LABELS.totalBudget}
                type="number"
                min="0"
                step="1000000"
                value={form.totalBudget}
                error={displayErrors.totalBudget}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {FIELD_LABELS.eventStatus}
                </label>
                <select
                  name="eventStatus"
                  value={form.eventStatus}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                >
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <FieldError message={displayErrors.eventStatus} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {FIELD_LABELS.eventDesc}
                </label>
                <textarea
                  name="eventDesc"
                  value={form.eventDesc}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={4}
                  className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting || !formValid}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editing ? 'Lưu cập nhật' : 'Thêm sự kiện'}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ eventId: editingId, eventName: form.eventName })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                >
                  <Trash2 size={16} />
                  Xóa sự kiện
                </button>
              ) : null}
            </div>
          </form>

          <section className="bg-dark-800 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-semibold text-white">Danh sách EVENT</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Nguồn dữ liệu từ API contract GET /api/events, tương ứng procedure
                  usp_Event_List.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadEvents()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <form
              onSubmit={handleFilterSubmit}
              className="p-5 border-b border-white/5 bg-dark-900/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-primary" />
                <h3 className="text-base font-semibold text-white">
                  Tìm kiếm và lọc theo usp_Event_List
                </h3>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Từ khóa
                  </label>
                  <input
                    name="keyword"
                    value={filters.keyword}
                    onChange={handleFilterChange}
                    placeholder="EventID, EventName, OrgName"
                    className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  />
                  <FieldError message={filterErrors.keyword} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="eventStatus"
                    value={filters.eventStatus}
                    onChange={handleFilterChange}
                    className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {EVENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <FieldError message={filterErrors.eventStatus} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Từ ngày bắt đầu
                  </label>
                  <input
                    name="fromDate"
                    type="date"
                    value={filters.fromDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Đến ngày bắt đầu
                  </label>
                  <input
                    name="toDate"
                    type="date"
                    value={filters.toDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  />
                  <FieldError message={filterErrors.toDate} />
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Sắp xếp phía frontend
                  </label>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition-colors"
                  >
                    <Search size={16} />
                    Tìm kiếm
                  </button>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                  >
                    <RotateCcw size={16} />
                    Reset lọc
                  </button>
                </div>
              </div>
            </form>

            {loading ? (
              <LoadingState label="Đang tải danh sách sự kiện..." />
            ) : loadError ? (
              <ErrorState description={loadError} onRetry={() => loadEvents()} />
            ) : events.length === 0 ? (
              <EmptyState
                title="Chưa có sự kiện"
                description="API đã phản hồi nhưng chưa có bản ghi EVENT phù hợp."
                action={
                  <button
                    type="button"
                    onClick={() => loadEvents()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-sm">
                  <thead className="bg-dark-700/70 text-gray-400">
                    <tr>
                      <TableHeader>Mã</TableHeader>
                      <TableHeader>Tên sự kiện</TableHeader>
                      <TableHeader>Nhà tổ chức</TableHeader>
                      <TableHeader>Thời gian</TableHeader>
                      <TableHeader>Quy mô</TableHeader>
                      <TableHeader>Ngân sách</TableHeader>
                      <TableHeader>Trạng thái</TableHeader>
                      <TableHeader>Phiên xác nhận</TableHeader>
                      <TableHeader>Thao tác</TableHeader>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedEvents.map((event) => (
                      <tr
                        key={event.eventId}
                        className={`hover:bg-white/[0.03] ${
                          editingId === event.eventId ? 'bg-primary/5' : ''
                        }`}
                      >
                        <TableCell className="font-semibold text-white">
                          {event.eventId}
                        </TableCell>
                        <TableCell>
                          <div className="text-white font-medium">{event.eventName}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {event.eventDesc || 'Không có mô tả'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{event.orgName || event.organizerId}</div>
                          <div className="text-xs text-gray-500">
                            {event.organizerType || event.organizerId}
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.eventStartDate} đến {event.eventEndDate}
                        </TableCell>
                        <TableCell>{event.expectedScale}</TableCell>
                        <TableCell>{formatCurrencyFull(event.totalBudget)}</TableCell>
                        <TableCell>
                          <EventStatusBadge status={event.eventStatus} />
                        </TableCell>
                        <TableCell>{event.confirmedSessionCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selectEventForEdit(event)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
                            >
                              <Edit3 size={14} />
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(event)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white transition-colors"
                            >
                              <Trash2 size={14} />
                              Xóa
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sự kiện"
        description={`Bạn có chắc muốn xóa ${
          deleteTarget?.eventName || deleteTarget?.eventId || 'sự kiện này'
        }? Backend sẽ quyết định có được xóa theo usp_Event_Delete hay không.`}
        confirmLabel="Xóa sự kiện"
        cancelLabel="Hủy"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </motion.div>
  );
}

function TextField({
  className = '',
  name,
  label,
  value,
  error,
  type = 'text',
  disabled = false,
  required = false,
  min,
  step,
  onChange,
  onBlur,
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {required ? <span className="text-red-300"> *</span> : null}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        min={min}
        step={step}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        className="w-full rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-white outline-none focus:border-primary disabled:opacity-70 disabled:cursor-not-allowed"
      />
      <FieldError message={error} />
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3 align-top text-gray-300 ${className}`}>{children}</td>;
}

function EventStatusBadge({ status }) {
  const className =
    status === 'Đã duyệt'
      ? 'bg-success/10 text-green-300 border-success/30'
      : status === 'Chờ duyệt'
        ? 'bg-warning/10 text-yellow-300 border-warning/30'
        : status === 'Từ chối'
          ? 'bg-red-500/10 text-red-300 border-red-500/30'
          : 'bg-info/10 text-blue-300 border-info/30';

  return (
    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${className}`}>
      {status || 'Chưa rõ'}
    </span>
  );
}
