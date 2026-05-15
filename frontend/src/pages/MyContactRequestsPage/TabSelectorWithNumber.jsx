import React from "react";

export default function TabSelectorWithNumber({
  tabs,
  activeTab,
  onTabChange,
}) {
  return (
    <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-200 overflow-x-auto gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === tab.id
              ? "bg-white text-blue-600 shadow-sm border border-gray-200/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>{tab.label}</span>

          <div className="flex items-center gap-0.5">
            {tab.badges?.map(
              (badge, index) =>
                badge.count > 0 && (
                  <span
                    key={index}
                    className={`px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold min-w-[18px] text-center ${badge.color}`}
                  >
                    {badge.count}
                  </span>
                )
            )}
          </div>
        </button>
      ))}
    </div>
  );
}