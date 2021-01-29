/* @ts-ignore */
import rawData1 from "./source1.json";
/* @ts-ignore */
import rawData2 from "./source2.json";

const source1 = rawData1 as ElementSource1[];
const source2 = rawData2 as ElementSource2[];

type Query = { symbol: string };

export const getElement = (q: Query) =>
  elementList.find((e) => ("symbol" in q ? e.symbol == q.symbol : false));

/** Internal */

export const elementList: KimiElement[] = source2.map(
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
    oxidationStates: source1[i].oxidationStates
      ? source1[i].oxidationStates
          .toString()
          .split(",")
          .map((x) => parseInt(x, 10))
      : null,
  })
);

export const elements: Record<string, KimiElement> = {};

for (const e of elementList) {
  elements[e.symbol] = e;
}

export interface KimiElement {
  atomicNumber: number;
  name: string;
  symbol: string;
  atomicMass: number;
  numberOfNeutrons: number;
  numberOfProtons: number;
  numberOfElectrons: number;
  period: number;
  group: number | null;
  phase: Phase;
  radioactive: boolean;
  natural: boolean;
  metal: boolean;
  nonmetal: boolean;
  metalloid: boolean;
  type: null | string;
  atomicRadius: number | null;
  electronegativity: number | null;
  firstIonization: number | null;
  density: number | null;
  meltingPoint: number | null;
  boilingPoint: number | null;
  numberOfIsotopes: number | null;
  discoverer: null | string;
  year: number | null;
  specificHeat: number | null;
  numberOfShells: number;
  numberOfValence: number | null;
  electronicConfiguration: string;
  groupBlock: GroupBlock;
  oxidationStates: null | number[];
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
