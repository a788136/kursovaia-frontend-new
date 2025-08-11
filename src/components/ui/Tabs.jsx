import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";

export default function Tabs({ tabs, value, onChange }) {
  const listRef = useRef(null);
  const btnRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  // позиционируем анимированную линию
  useEffect(() => {
    const el = btnRefs.current[value];
    const list = listRef.current;
    if (!el || !list) return;
    const { left: listLeft } = list.getBoundingClientRect();
    const { left, width } = el.getBoundingClientRect();
    setIndicator({ left: left - listLeft + list.scrollLeft, width });
  }, [value, tabs]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <div
        ref={listRef}
        className="relative flex gap-2 overflow-x-auto scrollbar-none"
      >
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              ref={(el) => (btnRefs.current[t.value] = el)}
              type="button"
              className={`px-4 py-2 text-sm font-medium relative transition-colors
                ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:text-blue-500"}`}
              onClick={() => onChange(t.value)}
            >
              {t.label}
            </button>
          );
        })}

        {/* индикатор */}
        <span
          className="absolute bottom-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300"
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
          }}
        />
      </div>
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
