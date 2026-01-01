"use client";

type ChildFilterProps = {
  selectedChildId: string | null;
  onSelect: (childId: string | null) => void;
  childList: Array<{
    id: string;
    name: string;
  }>;
};

export function ChildFilter({
  selectedChildId,
  onSelect,
  childList,
}: ChildFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          selectedChildId === null
            ? "bg-gray-800 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        全員
      </button>
      {childList.map((child) => {
        const isSelected = selectedChildId === child.id;
        const colorClass =
          child.name === "カイリ"
            ? isSelected
              ? "bg-kairi-500 text-white"
              : "bg-kairi-100 text-kairi-600 hover:bg-kairi-200"
            : isSelected
              ? "bg-mare-500 text-white"
              : "bg-mare-100 text-mare-600 hover:bg-mare-200";

        return (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${colorClass}`}
          >
            {child.name}
          </button>
        );
      })}
    </div>
  );
}
