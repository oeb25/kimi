import * as React from "react";
import * as mathjs from "mathjs";

export const Precision = React.createContext(3);

export const AnnotatedInput: React.FC<{
  value: number;
  onChange: (newValue: number) => void;
  placeholder: string;
  annotation: React.ReactNode;
}> = ({ value, onChange, placeholder, annotation }) => {
  return (
    <UnitInput
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      unit={annotation}
    />
  );
};

export const UnitInput: React.FC<
  | {
      value: number;
      onChange?: (x: number) => void;
      placeholder: string;
      precision?: number;
      unit?: React.ReactNode;
      minWidth?: boolean;
    }
  | {
      value: string;
      onChange?: undefined;
      placeholder: string;
      precision?: number;
      unit?: React.ReactNode;
      minWidth?: boolean;
    }
> = (args) => {
  const { placeholder, precision: prec, unit, minWidth = false } = args;

  const [focus, setFocus] = React.useState(false);
  const [ownValue, setOwnValue] = React.useState("");

  const ctxPrec = React.useContext(Precision);
  const precision =
    typeof prec == "number" ? prec : typeof ctxPrec == "number" ? ctxPrec : 3;

  React.useEffect(() => {
    if (!args.onChange) return;

    if (!focus) {
      if (evaluate(ownValue) != args.value)
        setOwnValue(prettyNumber(args.value, precision));
    }
  }, [focus, args.value]);

  return (
    <div className="flex font-mono">
      {args.onChange ? (
        <input
          // type="number"
          className={"w-32 text-right bg-transparent border-b border-gray-700"}
          placeholder={placeholder}
          value={
            focus || evaluate(ownValue) == args.value
              ? ownValue
              : prettyNumber(args.value, precision)
          }
          onChange={(e) => {
            if (!args.onChange) return;
            setOwnValue(e.target.value);
            args.onChange(evaluate(e.target.value));
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
      ) : (
        <span
          // type="number"
          className={
            "italic text-right text-gray-400 bg-transparent " +
            (minWidth ? "" : "w-32")
          }
        >
          {focus || evaluate(ownValue) == args.value
            ? ownValue
            : typeof args.value == "string"
            ? args.value
            : prettyNumber(args.value, precision)}
        </span>
      )}
      <div className={"pl-1 " + (minWidth && false ? "" : "w-10")}>{unit}</div>
    </div>
  );
};

// const prettyNumber = (x: number, precision: number) =>
//   10 > x && x >= 1
//     ? x.toFixed(precision)
//     : ((10000 > Math.abs(x) && Math.abs(x) > 0.0001) || x == 0) &&
//       (Math.abs(x) % 1).toString().length <= precision + 3
//     ? x.toString()
//     : x.toExponential(precision);
// const prettyNumber = (x: number, precision: number) =>
//   10 > x && x >= 1
//     ? x.toFixed(precision)
//     : (10000 > Math.abs(x) && Math.abs(x) > 0.0001) || x == 0
//     ? (Math.abs(x) % 1).toString().length > precision + 3
//       ? x.toFixed(precision)
//       : x.toString()
//     : x.toExponential(precision);
// const DANGER = true;
// const evaluate = (x: string) => (DANGER ? eval(x) : parseFloat(x));

const prettyNumber = (x: number, precision: number) =>
  mathjs.format(x, { precision });
const evaluate = (x: string) => mathjs.evaluate(x) as number;
