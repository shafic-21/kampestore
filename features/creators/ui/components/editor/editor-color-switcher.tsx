import { Button } from "@/components/ui/button";

// Simulated selected colors from the sidebar (static UI for now)
const selectedColors = [
  { name: "Natural", hex: "#F5F5DC" },
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Purple", hex: "#7C3AED" }
];

export const EditorColorSwitcher = () => (
  <div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
    {selectedColors.map((color, index) => (
      <button
        key={index}
        style={{ backgroundColor: color.hex }}
        className="rounded-full size-6 border border-gray-300 hover:border-gray-500 transition-colors"
        title={color.name}
      >
        <span className="sr-only">{color.name}</span>
      </button>
    ))}
  </div>
);
