import { GlassWater } from "lucide-react";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { wrapper: string; emoji: string }> = {
  sm: { wrapper: "h-7 w-7 rounded-lg", emoji: "text-xl" },
  md: { wrapper: "h-9 w-9 rounded-xl", emoji: "text-2xl" },
  lg: { wrapper: "h-11 w-11 rounded-xl", emoji: "text-3xl" },
};

export function DrinkImage({ value, size = "md" }: { value: string; size?: Size }) {
  const cls = sizeMap[size];
  const isPhoto = value.startsWith("data:") || value.startsWith("http") || value.startsWith("blob:");

  if (isPhoto) {
    return <img src={value} alt="" className={`${cls.wrapper} object-cover`} />;
  }
  if (value) {
    return <span className={cls.emoji}>{value}</span>;
  }
  return (
    <div className={`${cls.wrapper} flex items-center justify-center bg-muted`}>
      <GlassWater className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
