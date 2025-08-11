// Небольшой API‑хелпер для сохранения полей и формата кастомного ID.
// Подстрой под свои пути/авторизацию, если отличаются.
export async function saveFields({ baseUrl = '', inventoryId, fields, token }) {
  if (!inventoryId) throw new Error('inventoryId is required');
  const res = await fetch(`${baseUrl}/inventories/${encodeURIComponent(inventoryId)}/fields`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fields }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to save fields: ${res.status}`);
  return res.json();
}

export async function saveCustomIdFormat({ baseUrl = '', inventoryId, customIdFormat, token }) {
  if (!inventoryId) throw new Error('inventoryId is required');
  const res = await fetch(`${baseUrl}/inventories/${encodeURIComponent(inventoryId)}/custom-id-format`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ customIdFormat }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to save customIdFormat: ${res.status}`);
  return res.json();
}

// Если на бэке есть предпросмотр — используем:
export async function previewCustomId({ baseUrl = '', inventoryId, format, sampleFields }) {
  const res = await fetch(`${baseUrl}/inventories/${encodeURIComponent(inventoryId)}/custom-id/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, sampleFields }),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to preview: ${res.status}`);
  return res.json(); // { preview: "..." }
}
