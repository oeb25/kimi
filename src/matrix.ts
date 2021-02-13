import * as mathjs from "mathjs";

const simplifyRow = (row: number[]) => {
  let factor = 0;
  return row.map((x) => {
    if (x != 0) {
      if (factor == 0) {
        factor = x;
      }
      return x / factor;
    } else {
      return 0;
    }
  });
};

const reducedRowEchelonForm = (matrix: number[][]) => {
  // Copy matrix
  matrix = matrix.map((row) => row.slice(0));

  const numCols = matrix[0].length;

  // Eliminate downwards
  for (const [row, i] of matrix.map((row, i) => [row, i] as const)) {
    const firstNonZero = row.findIndex((x) => x != 0);

    if (firstNonZero == -1) continue;

    // All succeeding rows
    for (const other of matrix.slice(i + 1)) {
      const factor = other[firstNonZero] / row[firstNonZero];

      for (let j = firstNonZero; j < numCols; j++) {
        other[j] -= row[j] * factor;
      }
    }
  }

  // Eliminate upwards
  for (const [row, i] of matrix.map((row, i) => [row, i] as const)) {
    const firstNonZero = row.findIndex((x) => x != 0);

    if (firstNonZero == -1) continue;

    // All preceding rows
    for (const other of matrix.slice(0, i)) {
      const factor = other[firstNonZero] / row[firstNonZero];

      for (let j = firstNonZero; j < numCols; j++) {
        other[j] -= row[j] * factor;
      }
    }
  }

  const rref = matrix.map(simplifyRow);

  // Permute rows to get upper right triangle
  return sortByKey(rref, (row) => {
    const idx = row.findIndex((x) => x != 0);
    return idx >= 0 ? idx : Infinity;
  });
};

const nullSpace = (matrix: number[][]) => {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  const rref = reducedRowEchelonForm(matrix);

  let rank = rref.findIndex((row) => all(row, (x) => x == 0));
  if (rank == -1) rank = numRows;

  // Remove zero rows
  rref.splice(rank);

  // Determine the vectors spanning the null space of the matrix
  const span = range(rank, numCols).map((col) =>
    rref
      .map((row) => -row[col])
      .concat(range(rank, numCols).map((j) => (col == j ? 1 : 0)))
      .map((x) => mathjs.round(x, 10))
  );

  if (span.length == 0) {
    console.log(rref);
  }

  return span;
};

export const findIntegerSolutions = (matrix: number[][]) => {
  const span = nullSpace(matrix);

  if (span.length == 0) {
    console.log("span", span);
    throw "No solutions: Solutions space has dim 0";
  }

  const dims = span[0].length;

  const seenIds = new Set();

  let i = 1;

  return (function* () {
    while (i++ < 1000) {
      const factors = enumerate(i, span.length);

      const gcdFactors = factors.reduce(gcd);

      const id = factors.map((f) => f / gcdFactors).join(":");

      if (seenIds.has(id)) continue;

      const coefficients = range(0, dims).map((col) =>
        factors.reduce((acc, f, row) => acc + f * span[row][col], 0)
      );
      // If any coefficient is negative or non-integer, throw away the solution
      if (any(coefficients, (x) => x <= 0 || !Number.isInteger(x))) continue;
      seenIds.add(id);
      yield coefficients.map((x) => x | 0);
    }

    if (seenIds.size == 0) {
      console.log(span);
      throw "No solutions found";
    }
  })();
};

const enumerate = (i: number, dimensions: number): readonly number[] => {
  if (dimensions == 1) return [i];
  if (dimensions == 2) return P(i);
  throw "Too many independent solutions (currently only supports two free variables)";
};

const gcd = (x: number, y: number) => {
  if (typeof x != "number" || typeof y != "number" || isNaN(x) || isNaN(y))
    throw "Invalid argument";
  x = Math.abs(x);
  y = Math.abs(y);
  while (y != 0) {
    const z = x % y;
    x = y;
    y = z;
  }
  return x;
};

const range = (a: number, b: number) =>
  new Array(b - a).fill(0).map((_x, i) => i + a);

const L = (k: number) => Math.floor(1 / 2 + Math.sqrt(2 * k - 1));
const M = (k: number) => k - ((L(k) - 1) * L(k)) / 2;
const P = (k: number) => [M(k), 1 + L(k) - M(k)] as const;

const any = <T>(xs: T[], f: (x: T, index: number) => boolean) =>
  xs.findIndex(f) >= 0;
const all = <T>(xs: T[], f: (x: T, index: number) => boolean) =>
  xs.findIndex((x, i) => !f(x, i)) == -1;

const sortByKey = <T>(xs: T[], cmp: (x: T) => number) =>
  xs
    .map((x) => [cmp(x), x] as const)
    .sort(([a], [b]) => a - b)
    .map(([, x]) => x);
