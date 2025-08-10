import PropTypes from "prop-types";

export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="border-b">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              className={`px-3 py-2 rounded-t-2xl text-sm border-b-2 transition-all ${
                active
                  ? "border-blue-500 font-medium"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-selected={active}
              role="tab"
              onClick={() => onChange(t.value)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};