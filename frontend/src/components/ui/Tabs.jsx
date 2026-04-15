// src/components/ui/Tabs.jsx
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  variant = "underline",
}) {
  if (variant === "pills") {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 bg-bg-base border border-border-default rounded-lg ${className}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              "flex items-center px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-150 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-accent text-white shadow-sm"
                : "text-text-tertiary hover:text-text-secondary hover:bg-bg-muted",
            ].join(" ")}
          >
            {tab.icon && (
              <span className="w-4 h-4 mr-2 flex items-center justify-center shrink-0">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold inline-flex items-center justify-center min-w-[22px] leading-none shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-bg-muted text-text-quaternary"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default underline variant
  return (
    <div
      className={`flex items-center border-b border-border-muted ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            "flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all duration-150 whitespace-nowrap",
            activeTab === tab.id
              ? "text-accent border-accent"
              : "text-text-tertiary border-transparent hover:text-text-secondary",
          ].join(" ")}
        >
          {tab.icon && (
            <span className="flex items-center justify-center shrink-0">
              {tab.icon}
            </span>
          )}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold inline-flex items-center justify-center min-w-[22px] leading-none shrink-0 ${
                activeTab === tab.id
                  ? "bg-accent-muted text-accent"
                  : "bg-bg-muted text-text-quaternary"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
