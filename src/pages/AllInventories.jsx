// src/pages/AllInventories.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../services/inventoryService';
import InventoryForm from '../components/InventoryForm';
import Modal from '../components/Modal';
import { getToken as getAccessToken } from '../api/token';

import { useI18n, MESSAGES } from '../components/inventories/i18n';
import { normalizeInventory, listFilterSort } from '../components/inventories/listHelpers';
import InventoryGrid from '../components/inventories/InventoryGrid';
import Toolbar from '../components/inventories/Toolbar';
import Skeleton from '../components/inventories/Skeleton';

export default function AllInventories(props) {
  const navigate = useNavigate();
  const { t } = useI18n(props?.lang, props?.t);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('name');      // name | updatedAt | createdAt
  const [sortDir, setSortDir] = useState('asc');       // asc | desc

  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await inventoryService.getAll(); // публичный GET
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setRows(list.map(normalizeInventory));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Inventories load error:', e);
        setError(`${t('errorLoading')}${e?.message ? ': ' + e.message : ''}`);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // memoized filtered/sorted list (логика вынесена в helper)
  const filtered = useMemo(
    () => listFilterSort(rows, q, sortKey, sortDir),
    [rows, q, sortKey, sortDir]
  );

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // create
  const handleCreate = async (payload) => {
    setCreating(true);
    setError('');
    try {
      const token = getAccessToken(); // JWT
      const created = await inventoryService.create(payload, token);
      setRows((prev) => [normalizeInventory(created), ...prev]);
      setShowCreate(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      const message =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        t('errorLoading');
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Skeleton title={t('title')} />;
  }

  return (
    <div className="space-y-6">
      {/* errors */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* toolbar */}
      <Toolbar
        title={t('title')}
        q={q}
        setQ={setQ}
        creating={creating}
        onCreateClick={() => { setShowCreate(true); setError(''); }}
        t={t}
      />

      {/* grid */}
      {/* <InventoryGrid
        rows={filtered}
        onRowClick={(row) => navigate(`/inventories/${row._id}`)}
        sortKey={sortKey}
        sortDir={sortDir}
        toggleSort={toggleSort}
        t={t}
      /> */}

      {/* modal: create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('create')}>
        <InventoryForm
          submitText={creating ? t('creating') : t('create')}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
