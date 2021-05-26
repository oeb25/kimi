import * as React from "react";
import * as data from "../data";
import { calculateAtomicMass, tallyElements } from "../calc";
import { KimiElement } from "../data";
import { Katex } from "./Katex";
import {
  Compound,
  FormulaTerm,
  latexCompound,
  latexFormulaTerm,
} from "../parse";
import { keys, values } from "../util";
import { UnitInput } from "./UnitInput";

export const CompoundInfo: React.FC<{ ft: FormulaTerm }> = ({ ft }) => {
  const c = ft.compound;
  const cData = c.element;

  const atomicMass = calculateAtomicMass([c]);

  // const [moles, setMoles] = React.useState(1);
  const totalMoles = countMolesIn(c);

  return (
    <div className="grid gap-2 place-items-center">
      {c.group && c.group.length > 1 && (
        <div
          className="grid pb-1 border-b border-gray-900 gap-x-4 place-items-end"
          style={{
            gridTemplateColumns: `repeat(${c.group!.length + 1}, auto)`,
          }}
        >
          <span />
          {c.group!.map((c, i) => (
            <div key={i} className="text-center place-self-center">
              <Katex src={latexCompound(c)} />
            </div>
          ))}

          <b className="text-right">Moles in 1 mol:</b>
          {c.group!.map((x, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="mol" />}
              value={(countMolesIn(x) / totalMoles) * c.multi}
              minWidth={true}
            />
          ))}

          <b>Atomic Mass:</b>
          {c.group!.map((c, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="{g \over mol}" />}
              value={calculateAtomicMass([c])}
              minWidth={true}
            />
          ))}
          <span />
          {c.group!.map((x, i) => (
            <UnitInput
              key={i}
              placeholder="Ehh"
              unit={<Katex src="\%" />}
              value={(calculateAtomicMass([x]) / atomicMass) * c.multi * 100}
              minWidth={true}
            />
          ))}
        </div>
      )}

      <Katex src={latexFormulaTerm(ft)} />

      <div
        className="grid text-right"
        style={{ gridTemplateColumns: "auto auto", columnGap: "2em" }}
      >
        <DataRow title="Atomic Mass:">
          <Katex src={`${atomicMass} {g \\over mol}`} />
        </DataRow>

        {cData ? (
          <>
            <DataRow title="Atomic Nr:">
              <Katex src={`\\text{${cData.atomicNumber}}`} />
            </DataRow>
            <DataRow title="Name:">
              <Katex src={`\\text{${cData.name}}`} />
            </DataRow>
            <DataRow title="Period:">
              <Katex src={`\\text{${cData.period}}`} />
            </DataRow>
            <DataRow title="Group:">
              <Katex src={`\\text{${cData.group}}`} />
            </DataRow>
            <ElectronConfigList charge={ft.charge || 0} base={cData} />
            <DataRow title="Oxidation States:">
              {cData.oxidationStates ? (
                <Katex
                  src={cData.oxidationStates
                    .filter((o) => o.ions)
                    .map((o) => {
                      const ions = o.ions < 0 ? o.ions : "+" + o.ions;
                      return o.common
                        ? // ? `\\htmlStyle{color: gray;}{\\bm{${ions}}}`
                          `\\bm{${ions}}`
                        : `\\htmlStyle{opacity: 0.3;}{${ions}}`;
                    })
                    .join(", ")}
                />
              ) : (
                <p>Missing</p>
              )}
            </DataRow>
            <DataRow title="Valence Electrons:">
              <Katex src={`\\text{${cData.numberOfValence}}`} />
            </DataRow>
          </>
        ) : null}
      </div>
      {cData ? (
        <details className="w-full">
          <summary className="outline-none cursor-pointer">Details:</summary>
          <div
            className="grid gap-1 text-xs"
            style={{ gridTemplateColumns: "auto auto" }}
          >
            {keys(cData).map((k) => {
              const v = cData[k];

              const latex = Array.isArray(v)
                ? v.map((x) => x.ions).join(", ")
                : typeof v == "boolean"
                ? v
                  ? "\\text{Yes}"
                  : ""
                : typeof v == "string"
                ? `\\text{${v}}`
                : v?.toString();

              return (
                <React.Fragment key={k}>
                  <div className="font-bold">{k}</div>
                  <div className="text-right">
                    {latex ? <Katex src={latex} /> : <p />}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* <pre>{JSON.stringify(cData, null, 2)}</pre> */}
        </details>
      ) : null}
    </div>
  );
};

const countMolesIn = (c: Compound) =>
  values(tallyElements(c)).reduce((a, b) => a + b, 0);

const DataRow: React.FC<{ title: React.ReactChild; className?: string }> = ({
  title,
  children,
  className,
}) => {
  return (
    <>
      <label className={"font-bold " + className}>{title}</label>
      {React.Children.only(children)}
    </>
  );
};

// TODO: Adhere to charge

const parseEC = (ec: string) => {
  return ec.split(" ").map((e) => {
    if (e.startsWith("[")) {
      return e.replace(/[\[\]]/g, "");
    } else {
      const [, a, b, c] = e.match(/(\d*)(.)(\d*)/)!;
      return [a + b, parseInt(c)] as [string, number];
    }
  });
};

const parsedEC = (base: KimiElement | null) => {
  const ecs = [];
  let prev: KimiElement | null = null;

  while (base) {
    const res = parseEC(base.electronicConfiguration);
    const row = {
      from: prev,
      nested: null as KimiElement | null,
      electrons: [] as [string, number][],
    };

    base = null;
    if (typeof res[0] == "string") {
      base = data.elements[res[0]];
      row.nested = base;
      res.splice(0, 1);
    }
    prev = base;

    row.electrons = res as typeof row["electrons"];
    ecs.push(row);
  }

  return ecs;
};
type ParsedEC = ReturnType<typeof parsedEC>;

console.log(
  Object.fromEntries(
    parsedEC(data.elements["Og"])
      .map((e) => e.electrons)
      .reduce((a, b) => b.concat(a), [])
      .map((e) => [e[0], e[1]])
  )
);

// s
// s
// p
// s
// p
// s
// d
// p
// s
// d
// p
// s
// f
// d
// p
// s
// f
// d
// p
// gfdgfhghi

const orbitalAddOrder = [
  ["1s", 2, "2s"], // s
  ["2s", 2, "2p"], // s
  ["2p", 6, "3s"], // p
  ["3s", 2, "3p"], // s
  ["3p", 6, "4s"], // p
  ["4s", 2, "3d"], // s
  ["3d", 10, "4p"], // d
  ["4p", 6, "5s"], // p
  ["5s", 2, "4d"], // s
  ["4d", 10, "5p"], // d
  ["5p", 6, "6s"], // p
  ["6s", 2, "4f"], // s
  ["4f", 14, "5d"], // f
  ["5d", 10, "6p"], // d
  ["6p", 6, "7s"], // p
  ["7s", 2, "5f"], // s
  ["5f", 14, "6d"], // f
  ["6d", 10, "7p"], // d
  ["7p", 6, ""], // p
] as const;

const lastE = (ec: ParsedEC) => ec[0].electrons[ec[0].electrons.length - 1];

const adjustCharge = (ec: ParsedEC, charge: number) => {
  if (charge == 0) return ec;

  // Clone the EC
  const ec2 = ec.map((e) => ({
    from: e.from,
    nested: e.nested,
    electrons: e.electrons.map((x) => [x[0], x[1]] as [string, number]),
  }));

  // TODO: Implement for negative charge
  if (charge < 0) {
    // Sort elections in add order
    ec2[0].electrons.sort((a, b) =>
      a[0][0] == "["
        ? Infinity
        : b[0][0]
        ? -Infinity
        : orbitalAddOrder.findIndex((x) => x[0] == a[0])! -
          orbitalAddOrder.findIndex((x) => x[0] == b[0])!
    );

    while (charge < 0) {
      const l = lastE(ec2);
      console.log("pre", ec2[0]);
      const max = orbitalAddOrder.find((x) => x[0] == l[0])!;
      if (l[1] == max[1]) {
        ec2[0].electrons.push([max[2], 1]);
      } else {
        l[1] += 1;
      }
      console.log("post", ec2[0]);
      charge += 1;
    }

    return ec2;
  }

  while (charge > 0 && ec2.length > 0) {
    console.log(ec2);

    if (
      ec2[0].electrons.length == 0 ||
      (ec2[0].electrons.length == 1 && ec2[0].electrons[0].indexOf("[") == 0)
    ) {
      ec2.splice(0, 1);
      continue;
    }

    ec2[0].electrons[ec2[0].electrons.length - 1][1] -= 1;
    charge -= 1;

    if (ec2[0].electrons[ec2[0].electrons.length - 1][1] == 0)
      ec2[0].electrons.pop();
  }

  if (
    ec2[0].electrons.length == 0 ||
    (ec2[0].electrons.length == 1 && ec2[0].electrons[0].indexOf("[") == 0)
  ) {
    ec2.splice(0, 1);
    ec2[0].from = null;
  }

  return ec2;
};

const ElectronConfigList: React.FC<{ charge: number; base: KimiElement }> = ({
  charge,
  base,
}) => {
  const ec = adjustCharge(parsedEC(base), charge);
  const [expand, setExpand] = React.useState(false);

  return (
    <>
      {ec.slice(0, expand ? void 0 : 1).map((e, i) => (
        <DataRow
          key={i}
          title={
            e.from ? (
              <Katex src={`\\text{${e.from.symbol}}`} />
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={expand}
                  onChange={(e) => setExpand(e.target.checked)}
                />{" "}
                Election Config:
              </>
            )
          }
        >
          <Katex
            src={[...(e.nested ? [e.nested.symbol] : []), ...e.electrons]
              .map((e) => {
                if (typeof e == "object") {
                  const [a, b] = e;
                  return `${a}^{${b}}`;
                } else {
                  return `\\text{[${e}]}`;
                }
              })
              .join("\\;")}
          />
        </DataRow>
      ))}

      {/* {expand ? (
        <div className="grid grid-cols-5 col-span-2 text-center place-self-center">
          <div className="grid w-10 h-10 col-start-1 row-start-2 m-1 border place-items-center">
            AV
          </div>
          <div className="grid w-10 h-10 col-start-3 row-start-2 m-1 border place-items-center"></div>
          <div className="grid w-10 h-10 col-start-5 row-start-2 m-1 border place-items-center"></div>
          <div className="grid w-10 h-10 col-start-2 row-start-1 m-1 border place-items-center"></div>
          <div className="grid w-10 h-10 col-start-4 row-start-1 m-1 border place-items-center"></div>
        </div>
      ) : null} */}
    </>
  );
};
