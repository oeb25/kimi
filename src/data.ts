/* @ts-ignore */
import source1Raw from "./sources/source1.json";
/* @ts-ignore */
import source2Raw from "./sources/source2.json";
/* @ts-ignore */
import oxidationStatesRaw from "./sources/oxidationStates.json";

const source1 = source1Raw as readonly ElementSource1[];
const source2 = source2Raw as readonly ElementSource2[];
const oxidationStates = oxidationStatesRaw as readonly OxidationState[][];

type Query = { symbol: string };

export const getElement = (q: Query) =>
  elementList.find((e) => ("symbol" in q ? e.symbol == q.symbol : false));

/** Internal */

export const elementList: readonly KimiElement[] = source2.map(
  (e, i): KimiElement => ({
    atomicNumber: e.AtomicNumber,
    name: e.Element,
    symbol: e.Symbol,
    atomicMass: e.AtomicMass,
    numberOfNeutrons: e.NumberofNeutrons,
    numberOfProtons: e.NumberofProtons,
    numberOfElectrons: e.NumberofElectrons,
    period: e.Period,
    group: e.Group,
    phase: e.Phase,
    radioactive: e.Radioactive,
    natural: e.Natural,
    metal: e.Metal,
    nonmetal: e.Nonmetal,
    metalloid: e.Metalloid,
    type: e.Type,
    atomicRadius: e.AtomicRadius,
    electronegativity: e.Electronegativity,
    firstIonization: e.FirstIonization,
    density: e.Density,
    meltingPoint: e.MeltingPoint,
    boilingPoint: e.BoilingPoint,
    numberOfIsotopes: e.NumberOfIsotopes,
    discoverer: e.Discoverer,
    year: e.Year,
    specificHeat: e.SpecificHeat,
    numberOfShells: e.NumberofShells,
    numberOfValence: e.NumberofValence,
    electronicConfiguration: source1[i].electronicConfiguration,
    groupBlock: source1[i].groupBlock,
    oxidationStates: oxidationStates[i],
    // oxidationStates: source1[i].oxidationStates
    //   ? source1[i].oxidationStates
    //       .toString()
    //       .split(",")
    //       .map((x) => parseInt(x, 10))
    //   : null,
  })
);

const elementsMap: Record<string, Readonly<KimiElement>> = {};

for (const e of elementList) {
  elementsMap[e.symbol] = e;
}

export const elements = elementsMap as Readonly<Record<string, KimiElement>>;

export interface KimiElement {
  readonly atomicNumber: number;
  readonly name: string;
  readonly symbol: string;
  readonly atomicMass: number;
  readonly numberOfNeutrons: number;
  readonly numberOfProtons: number;
  readonly numberOfElectrons: number;
  readonly period: number;
  readonly group: number | null;
  readonly phase: Phase;
  readonly radioactive: boolean;
  readonly natural: boolean;
  readonly metal: boolean;
  readonly nonmetal: boolean;
  readonly metalloid: boolean;
  readonly type: null | string;
  readonly atomicRadius: number | null;
  readonly electronegativity: number | null;
  readonly firstIonization: number | null;
  readonly density: number | null;
  readonly meltingPoint: number | null;
  readonly boilingPoint: number | null;
  readonly numberOfIsotopes: number | null;
  readonly discoverer: null | string;
  readonly year: number | null;
  readonly specificHeat: number | null;
  readonly numberOfShells: number;
  readonly numberOfValence: number | null;
  readonly electronicConfiguration: string;
  readonly groupBlock: GroupBlock;
  readonly oxidationStates: OxidationState[];
}

/** Source 1: ??? */

export interface ElementSource1 {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: AtomicMass;
  cpkHexColor: CpkHexColor;
  electronicConfiguration: string;
  electronegativity: CpkHexColor;
  atomicRadius: AtomicRadius;
  ionRadius: string;
  vanDelWaalsRadius: AtomicRadius;
  ionizationEnergy: AtomicRadius;
  electronAffinity: AtomicRadius;
  oxidationStates: AtomicRadius;
  standardState: StandardState;
  bondingType: BondingType;
  meltingPoint: AtomicRadius;
  boilingPoint: AtomicRadius;
  density: CpkHexColor;
  groupBlock: GroupBlock;
  yearDiscovered: YearDiscoveredUnion;
}

export type GroupBlock =
  | "nonmetal"
  | "noble gas"
  | "alkali metal"
  | "alkaline earth metal"
  | "metalloid"
  | "halogen"
  | "metal"
  | "transition metal"
  | "lanthanoid"
  | "actinoid"
  | "post-transition metal";

export type AtomicMass = number[] | string;

export type AtomicRadius = number | string;

export enum BondingType {
  Atomic = "atomic",
  CovalentNetwork = "covalent network",
  Diatomic = "diatomic",
  Empty = "",
  Metallic = "metallic",
}

export type CpkHexColor = number | string;

export enum StandardState {
  Empty = "",
  Gas = "gas",
  Liquid = "liquid",
  Solid = "solid",
}

export type YearDiscoveredUnion = YearDiscoveredEnum | number;

export enum YearDiscoveredEnum {
  Ancient = "Ancient",
}

/** Source 2: https://gist.github.com/GoodmanSciences/c2dd862cd38f21b0ad36b8f96b4bf1ee */

export interface ElementSource2 {
  AtomicNumber: number;
  Element: string;
  Symbol: string;
  AtomicMass: number;
  NumberofNeutrons: number;
  NumberofProtons: number;
  NumberofElectrons: number;
  Period: number;
  Group: number | null;
  Phase: Phase;
  Radioactive: boolean;
  Natural: boolean;
  Metal: boolean;
  Nonmetal: boolean;
  Metalloid: boolean;
  Type: null | string;
  AtomicRadius: number | null;
  Electronegativity: number | null;
  FirstIonization: number | null;
  Density: number | null;
  MeltingPoint: number | null;
  BoilingPoint: number | null;
  NumberOfIsotopes: number | null;
  Discoverer: null | string;
  Year: number | null;
  SpecificHeat: number | null;
  NumberofShells: number;
  NumberofValence: number | null;
}

export enum Phase {
  Artificial = "artificial",
  Gas = "gas",
  Liq = "liq",
  Solid = "solid",
}

/** Source 3: https://en.wikipedia.org/wiki/Oxidation_state#List_of_oxidation_states_of_the_elements */

/* Extraction code:

  Array.from($0.children).map(({ children }) =>
    Array.from(children)
      .slice(3, 18)
      .map((g, i) =>
        g.textContent.trim()
          ? { common: !!g.querySelector("b"), ions: i - 5 }
          : null
      )
      .filter((x) => x)
  );
*/

export interface OxidationState {
  common: boolean;
  ions: number;
}

/** Tables */

const table = {
  "16.4": {
    name:
      "Ionization Constants of Some Diprotic Acids and a Polyprotic Acid and their Conjugate Bases at 258C",
    entries: [
      {
        "Name of acid": "Sulfuric acid",
        Formula: "H2SO4",
        Ka: Infinity,
        "Conjugate Base": "HSO-4",
        Kb: 1e-20,
      },
    ],
  },
};
