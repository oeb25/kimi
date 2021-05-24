import * as React from "react";

export const TextFit: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const outerHeight = parseInt(window.getComputedStyle(el).height, 10);
    const diff = outerHeight - el.clientHeight;

    el.style.height = "0px";

    el.style.height = el.scrollHeight + diff + "px";
  }, [value]);

  return (
    <textarea
      // type="text"
      placeholder={placeholder}
      ref={ref}
      className="w-full p-2 border rounded resize-none"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  );
};
