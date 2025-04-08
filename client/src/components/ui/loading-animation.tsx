import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  size?: number;
  className?: string;
  text?: string;
  textClassName?: string;
  variant?: "default" | "spinner" | "dots" | "pulse";
}

export function LoadingAnimation({
  size = 24,
  className,
  text,
  textClassName,
  variant = "default",
}: LoadingAnimationProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  // Spinner animation
  const spinnerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  // Dots animation
  const dotsVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  // Text animation
  const textVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className,
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {variant === "default" && (
        <motion.div
          variants={spinnerVariants}
          className="flex items-center justify-center"
        >
          <Loader2 size={size} className="animate-spin text-primary" />
        </motion.div>
      )}

      {variant === "spinner" && (
        <motion.div
          variants={spinnerVariants}
          className="relative flex items-center justify-center"
        >
          <div
            className="absolute border-t-2 border-primary rounded-full animate-spin"
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
          <div
            className="absolute border-2 border-gray-200 dark:border-gray-700 rounded-full opacity-25"
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        </motion.div>
      )}

      {variant === "dots" && (
        <motion.div className="flex space-x-2" variants={dotsVariants}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              initial={{ opacity: 0.3 }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
                transition: {
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                },
              }}
            />
          ))}
        </motion.div>
      )}

      {variant === "pulse" && (
        <motion.div
          className="rounded-full bg-primary"
          style={{ width: size * 0.5, height: size * 0.5 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {text && (
        <motion.p
          className={cn(
            "text-sm text-gray-500 dark:text-gray-400",
            textClassName,
          )}
          variants={textVariants}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

export function LoadingSkeleton({
  className,
  children,
  isLoading,
}: {
  className?: string;
  children: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: isLoading ? 1 : 0,
        height: isLoading ? "auto" : 0,
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(className, isLoading ? "block" : "hidden")}
    >
      {children}
    </motion.div>
  );
}

export function LoadingContainer({
  children,
  isLoading,
  loadingContent,
  className,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingContent: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isLoading ? 0 : 1,
          y: isLoading ? 20 : 0,
        }}
        transition={{
          duration: 0.3,
          delay: isLoading ? 0 : 0.2,
        }}
        className={isLoading ? "invisible h-0" : "visible"}
      >
        {children}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isLoading ? 1 : 0,
          y: isLoading ? 0 : -20,
        }}
        transition={{ duration: 0.3 }}
        className={isLoading ? "visible" : "invisible h-0"}
      >
        {loadingContent}
      </motion.div>
    </div>
  );
}
