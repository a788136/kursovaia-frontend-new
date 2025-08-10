const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

function pickInventoryShape(body) {
  // Универсальный маппер: поддерживаем {data}, {inventory} и голый объект
  const raw = body?.data ?? body?.inventory ?? body;
  if (!raw || typeof raw !== 'object') return raw;
  // Нормализуем ключевые поля (если бэк их назвал по‑другому)
  return {
    _id: raw._id || raw.id || raw._id?.$oid || null,
    name: raw.name || raw.title || "",
    description: raw.description || raw.desc || "",
    category: raw.category || raw.cat || null,
    image: raw.image || raw.imageUrl || raw.cover || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    customIdFormat: raw.customIdFormat || raw.custom_id_format || null,
    fields: Array.isArray(raw.fields) ? raw.fields : [],
    access: raw.access || {},
    stats: raw.stats || {},
    // оставляем все остальные поля как есть
    ...raw,
  };
}

export async function getInventoryById(id, token) {
  const res = await fetch(`${API_BASE}/inventories/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // credentials по умолчанию не отправляем — мы на JWT
  });
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) reason = body.message;
      if (body?.error) reason = body.error;
    } catch {}
    throw new Error(reason);
  }
  const body = await res.json();
  return pickInventoryShape(body);
}