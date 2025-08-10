export function ExportTab({ inventory }) {
  return (
    <div className="p-4 rounded-2xl border">
      <div className="font-medium mb-1">Export</div>
      <p className="opacity-80">Export to CSV/Excel (optional requirement), respecting filters.</p>
    </div>
  );
}
export default ExportTab;