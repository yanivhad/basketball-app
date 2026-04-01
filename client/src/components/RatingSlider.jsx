export default function RatingSlider({ label, value, onChange }) {
  const color = value >= 8 ? "text-green-400" : value >= 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-36 shrink-0">{label}</span>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="flex-1 accent-orange-500"
      />
      <span className={`font-bold text-lg w-6 text-right ${color}`}>{value}</span>
    </div>
  );
}