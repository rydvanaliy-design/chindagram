// Rounded avatar. Falls back to the first initial. `ring` shows a gradient ring.
export default function Avatar({ name, image, size = 32, ring = false }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const inner = image ? (
    <img src={image} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex items-center justify-center rounded-full bg-brand font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45 }}>{initial}</span>
  );

  if (!ring) return inner;
  return (
    <span className="story-ring inline-block rounded-full p-[2px]">
      <span className="block rounded-full bg-white p-[2px]">{inner}</span>
    </span>
  );
}
