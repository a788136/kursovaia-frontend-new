import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getInventoryById } from "../services/inventories";
import Tabs from "../components/ui/Tabs";
import ItemsTab from "../components/inventory/ItemsTab";
import ChatTab from "../components/inventory/ChatTab";
import SettingsTab from "../components/inventory/SettingsTab";
import CustomIdTab from "../components/inventory/CustomIdTab";
import FieldsTab from "../components/inventory/FieldsTab";
import AccessTab from "../components/inventory/AccessTab";
import StatsTab from "../components/inventory/StatsTab";
import ExportTab from "../components/inventory/ExportTab";

const TAB_VALUES = [
  { value: "items", label: "Items" },
  { value: "chat", label: "Chat" },
  { value: "settings", label: "Settings" },
  { value: "custom-id", label: "Custom ID" },
  { value: "fields", label: "Fields" },
  { value: "access", label: "Access" },
  { value: "stats", label: "Stats" },
  { value: "export", label: "Export" },
];

export default function InventoryDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState(null);

  const activeTab = useMemo(() => {
    const q = searchParams.get("tab");
    return TAB_VALUES.some(t => t.value === q) ? q : "items";
  }, [searchParams]);

  const onTabChange = (nextValue) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextValue);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    getInventoryById(id)
      .then((data) => {
        if (ignore) return;
        setInventory(data);
      })
      .catch((e) => {
        if (ignore) return;
        setError(e?.message || "Failed to load inventory");
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const title = inventory?.name || `Inventory ${id}`;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/inventories" className="text-sm opacity-70 hover:opacity-100">← Back</Link>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>

      {loading && (
        <div className="animate-pulse p-4 rounded-2xl border">
          Loading inventory…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl border border-red-300 bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <Tabs tabs={TAB_VALUES} value={activeTab} onChange={onTabChange} />

          <div className="mt-4">
            {activeTab === "items" && <ItemsTab inventory={inventory} />}
            {activeTab === "chat" && <ChatTab inventory={inventory} />}
            {activeTab === "settings" && <SettingsTab inventory={inventory} />}
            {activeTab === "custom-id" && <CustomIdTab inventory={inventory} />}
            {activeTab === "fields" && <FieldsTab inventory={inventory} />}
            {activeTab === "access" && <AccessTab inventory={inventory} />}
            {activeTab === "stats" && <StatsTab inventory={inventory} />}
            {activeTab === "export" && <ExportTab inventory={inventory} />}
          </div>
        </>
      )}
    </div>
  );
}
