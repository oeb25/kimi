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
            <ElectronConfigList base={cData} />
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

const ElectronConfigList: React.FC<{ base: KimiElement }> = ({ base }) => {
  const [expand, setExpand] = React.useState(false);
  let i = 0;
  const entries = [
    <DataRow
      key={i++}
      title={
        <>
          <input
            type="checkbox"
            checked={expand}
            onChange={(e) => setExpand(e.target.checked)}
          />{" "}
          Election Config:
        </>
      }
      className="cursor-pointer select-none"
    >
      <Katex src={(base.electronicConfiguration || "").replace(/ /g, "\\;")} />
    </DataRow>,
  ];

  if (expand) {
    const re = /\[([a-z]*)\] (.*)/i;
    let m = re.exec(base.electronicConfiguration);
    while (m) {
      const sym = m[1];
      const next = data.elements[sym];
      entries.push(
        <DataRow key={i++} title={<Katex src={sym} />}>
          <Katex
            src={(next.electronicConfiguration || "").replace(/ /g, "\\;")}
          />
        </DataRow>
      );

      m = re.exec(next.electronicConfiguration);
    }
  }

  return <React.Fragment key={"idk-" + i}>{entries}</React.Fragment>;
};
