type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

/** Fade-in murni CSS (tanpa JS). Dimatikan otomatis oleh prefers-reduced-motion di globals.css. */
export default function Muncul({ children, delay = 0, className = "" }: Props) {
  return (
    <div className={`muncul ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
