import { motion } from "framer-motion";
import { slideIn } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { withReducedMotion } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useReducedMotion();
  const variants = withReducedMotion(slideIn, reduced);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
}
