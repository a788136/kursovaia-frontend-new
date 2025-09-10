// src/components/SupportTicketModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { createSupportTicket } from '../services/supportTicketService';

export default function SupportTicketModal({ open, onClose, user, template: initialTemplate = '' , lang = 'ru' }) {
  const t = useMemo(() => ({
    ru: {
      title: 'Создать тикет поддержки',
      summary: 'Краткое описание',
      priority: 'Приоритет',
      high: 'High',
      average: 'Average',
      low: 'Low',
      cancel: 'Отмена',
      submit: 'Отправить',
      submitted: 'Тикет отправлен',
      link: 'Ссылка',
      template: 'Шаблон',
      reportedBy: 'Автор',
      openFile: 'Открыть файл'
    },
    en: {
      title: 'Create support ticket',
      summary: 'Summary',
      priority: 'Priority',
      high: 'High',
      average: 'Average',
      low: 'Low',
      cancel: 'Cancel',
      submit: 'Submit',
      submitted: 'Ticket submitted',
      link: 'Link',
      template: 'Template',
      reportedBy: 'Reported by',
      openFile: 'Open file'
    }
  }), []);
  const L = t[lang] || t.ru;

  const [summary, setSummary] = useState('');
  const [priority, setPriority] = useState('Average');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // {file, payload}
  const [template, setTemplate] = useState(initialTemplate || '');

  useEffect(() => { setTemplate(initialTemplate || ''); }, [initialTemplate]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      setPending(true);
      setError('');
      const link = window.location.href;
      const resp = await createSupportTicket({ summary, priority, link, template });
      setDone(resp);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed');
    } finally {
      setPending(false);
    }
  };

  const onCloseLocal = () => {
    setSummary('');
    setPriority('Average');
    setError('');
    setDone(null);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCloseLocal} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:text-gray-100">
        <div className="mb-4 text-lg font-semibold">{L.title}</div>

        {done ? (
          <div className="space-y-3">
            <div className="rounded-md border border-green-300 bg-green-50 p-3 text-green-800 dark:bg-green-900/30 dark:text-green-200">
              {L.submitted}
            </div>
            <div className="text-sm">
              <div><span className="font-medium">{L.priority}:</span> {done?.payload?.priority}</div>
              <div><span className="font-medium">{L.summary}:</span> {done?.payload?.summary}</div>
              <div><span className="font-medium">{L.template}:</span> {done?.payload?.template || '—'}</div>
              <div><span className="font-medium">{L.link}:</span> <a className="text-blue-600 underline" href={done?.payload?.link} target="_blank" rel="noreferrer">{done?.payload?.link}</a></div>
              <div><span className="font-medium">{L.reportedBy}:</span> {done?.payload?.reportedBy?.name || '—'} ({done?.payload?.reportedBy?.email || '—'})</div>
            </div>
            {done?.file?.url && (
              <a href={done.file.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                {L.openFile}
              </a>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={onCloseLocal} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">{L.cancel}</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-200">{error}</div>}

            <div className="space-y-1">
              <label className="text-sm">{L.summary}</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">{L.priority}</label>
              <select
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="High">{L.high}</option>
                <option value="Average">{L.average}</option>
                <option value="Low">{L.low}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm">{L.template}</label>
              <input
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="(опционально)"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCloseLocal} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">{L.cancel}</button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pending ? '...' : L.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

SupportTicketModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.object,
  template: PropTypes.string,
  lang: PropTypes.string,
};
