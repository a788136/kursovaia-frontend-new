export function StatsTab({ inventory }) {
  return (
    <div className="p-4 rounded-2xl border">
      <div className="font-medium mb-1">Stats</div>
      <p className="opacity-80">Auto-calculated counts, ranges, and frequency stats; read-only.</p>
    </div>
  );
}
export default StatsTab;