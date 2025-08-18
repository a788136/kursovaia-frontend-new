// src/components/inventories/listHelpers.js

// Единая сетка колонок для "таблицы" на div-ах
export const GRID_COLS = '4rem 2fr 1.2fr 3fr 1.1fr';

// Нормализация инвентаря к единому виду
export function normalizeInventory(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const ownerName =
    typeof raw.owner === 'object' && raw.owner?.name ? raw.owner.name : undefined;

  return {
    _id: raw._id || raw.id || raw._id?.$oid || '',
    name: raw.name || raw.title || 'Без названия',
    description: raw.description || raw.desc || '',
    cover: raw.cover || raw.image || raw.imageUrl || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    owner: raw.owner ?? null,
    owner_id: raw.owner_id ?? (typeof raw.owner === 'string' ? raw.owner : undefined),
    ownerName,
    createdAt: raw.createdAt || raw.created_at || null,
    updatedAt: raw.updatedAt || raw.updated_at || null,
    ...raw,
  };
}

export function formatAuthor(row) {
  if (typeof row.owner === 'object' && row.owner?.name) return row.owner.name;
  if (row.owner_id) return String(row.owner_id);
  if (typeof row.owner === 'string') return row.owner;
  return '—';
}

// Локальная фильтрация и сортировка (повторяет логику из исходного файла)
export function listFilterSort(rows, q, sortKey, sortDir) {
  const norm = (s) => (s || '').toString().toLowerCase();
  const query = q.trim().toLowerCase();

  let arr = rows.filter((r) => {
    const name = norm(r.name);
    const desc = norm(r.description);
    const tags = Array.isArray(r.tags) ? r.tags.map((t) => norm(t)).join(' ') : '';
    const ownerName =
      r.ownerName ? norm(r.ownerName) :
      (typeof r.owner === 'object' && r.owner?.name ? norm(r.owner.name) : '');
    const ownerId = (typeof r.owner === 'string' ? r.owner : r.owner_id || '')
      .toString()
      .toLowerCase();

    return (
      !query ||
      name.includes(query) ||
      desc.includes(query) ||
      tags.includes(query) ||
      ownerName.includes(query) ||
      ownerId.includes(query)
    );
  });

  const dir = sortDir === 'asc' ? 1 : -1;

  arr.sort((a, b) => {
    let va; let vb;
    if (sortKey === 'updatedAt') {
      va = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      vb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    } else if (sortKey === 'createdAt') {
      va = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      vb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    } else {
      va = (a?.name ?? '').toString().toLowerCase();
      vb = (b?.name ?? '').toString().toLowerCase();
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  return arr;
}
