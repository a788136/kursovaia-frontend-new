export default function ItemsTab({ inventory }) {
  return (
    <div className="p-4 rounded-2xl border">
      <div className="text-sm opacity-70 mb-2">Inventory ID: {inventory._id}</div>
      <div className="font-medium mb-1">Items</div>
      <p className="opacity-80">Here will be the items table and CRUD, respecting access rules.</p>
    </div>
  );
}