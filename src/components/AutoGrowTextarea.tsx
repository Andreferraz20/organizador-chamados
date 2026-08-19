import { useLayoutEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Textarea that grows with its content instead of scrolling internally, so
 * long laudos/detalhes scroll with the page instead of hiding text in a
 * tiny inner scrollbar.
 */
export function AutoGrowTextarea({ className, value, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      className={`resize-none overflow-hidden ${className ?? ""}`}
      {...rest}
    />
  );
}
