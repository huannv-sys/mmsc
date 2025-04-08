import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonPulseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export function SkeletonPulse({
  className,
  width,
  height,
  borderRadius = "0.375rem",
}: SkeletonPulseProps) {
  return (
    <motion.div
      className={cn(
        "bg-gray-200 dark:bg-gray-700 relative overflow-hidden",
        className,
      )}
      style={{
        width: width || "100%",
        height: height || "1rem",
        borderRadius,
      }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
        }}
        animate={{ translateX: ["0%", "200%"] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

export function SkeletonTable({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between">
        <SkeletonPulse width={150} height={22} />
        <SkeletonPulse width={100} height={22} />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonPulse width={40} height={40} borderRadius="50%" />
              <div className="space-y-2">
                <SkeletonPulse width={180} height={16} />
                <SkeletonPulse width={120} height={12} />
              </div>
            </div>
            <SkeletonPulse width={80} height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="space-y-3">
        <SkeletonPulse width={200} height={24} />
        <SkeletonPulse width={150} height={16} />
        <div className="pt-4">
          <SkeletonTable rows={3} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStats({
  cols = 4,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", `grid-cols-${cols}`, className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <SkeletonPulse width={100} height={16} />
          <SkeletonPulse width={120} height={28} />
          <SkeletonPulse width="70%" height={10} />
        </div>
      ))}
    </div>
  );
}
