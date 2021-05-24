import * as React from "react";

export const TextFit: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    const diffHeight = outerHeight - el.clientHeight;

    el.style.height = "0px";

    el.style.height = el.scrollHeight + diffHeight + "px";
  }, [value]);

  return (
    <textarea
      // type="text"
      placeholder={placeholder}
      ref={ref}
      className={"p-2 border rounded resize-none " + className}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
};
