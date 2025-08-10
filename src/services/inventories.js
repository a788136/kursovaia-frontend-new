const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export async function getInventoryById(id) {
  const res = await fetch(`${API_BASE}/inventories/${id}`, {
    method: "GET",
    credentials: "include",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) {
    let reason = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) reason = body.message;
    } catch {}
    throw new Error(reason);
  }
  return res.json();
}