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

const swapRows = (matrix: number[][], i: number, j: number) => {
  if (i == j) return matrix;

  i = Math.min(i, j);
  j = Math.max(i, j);
  return [
    ...matrix.slice(0, i),
    matrix[j],
    ...matrix.slice(i + 1, j),
    matrix[i],
    ...matrix.slice(j + 1),
  ];
};

const addRows = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);
const multiplyRow = (a: number[], s: number) => a.map((x) => x * s);
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

// Changes this matrix to reduced row echelon form (RREF), except that each leading coefficient is not necessarily 1. Each row is simplified.
const gaussJordanEliminate = (matrix: number[][]) => {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Simplify all rows
  matrix = matrix.map(simplifyRow);

  // Compute row echelon form (REF)
  let numPivots = 0;
  for (let i = 0; i < numCols; i++) {
    // Find pivot
    let pivotRow = numPivots;
    while (pivotRow < numRows && matrix[pivotRow][i] == 0) pivotRow++;
    if (pivotRow == numRows) continue;
    const pivot = matrix[pivotRow][i];
    matrix = swapRows(matrix, numPivots, pivotRow);
    numPivots++;

    // Eliminate below
    for (let j = numPivots; j < numRows; j++) {
      const g = gcd(pivot, matrix[j][i]);
      matrix[j] = simplifyRow(
        addRows(
          multiplyRow(matrix[j], pivot / g),
          multiplyRow(matrix[i], -matrix[j][i] / g)
        )
      );
    }
  }

  // Compute reduced row echelon form (RREF), but the leading coefficient need not be 1
  for (let i = numRows - 1; i >= 0; i--) {
    // Find pivot
    let pivotCol = 0;
    while (pivotCol < numCols && matrix[i][pivotCol] == 0) pivotCol++;
    if (pivotCol == numCols) continue;
    const pivot = matrix[i][pivotCol];

    // Eliminate above
    for (let j = i - 1; j >= 0; j--) {
      const g = gcd(pivot, matrix[j][pivotCol]);
      matrix[j] = simplifyRow(
        addRows(
          multiplyRow(matrix[j], pivot / g),
          multiplyRow(matrix[i], -matrix[j][pivotCol] / g)
        )
      );
    }
  }

  return matrix;
};

const approxRational = (x: number) => {
  const sign = Math.sign(x);
  x = Math.abs(x);

  let a = 1;
  let b = 1;

  let delta = a / b - x;

  while (Math.abs(delta) > 0.0001) {
    if (delta > 0) {
      b += 1;
    } else {
      a += 1;
    }
    delta = a / b - x;
  }

  return [sign * a, b] as const;
};

console.log(approxRational(2 / 3));

export const findIntegerSolution = (matrix: number[][]) => {
  const eliminated = gaussJordanEliminate(matrix);
  const numRows = eliminated.length;
  const numCols = eliminated[0].length;

  function countNonzeroCoeffs(matrix: number[][], row: number): number {
    let count = 0;
    for (let i = 0; i < numCols; i++) {
      if (matrix[row][i] != 0) count++;
    }
    return count;
  }

  // Find row with more than one non-zero coefficient
  let i;
  for (i = 0; i < numRows - 1; i++) {
    if (countNonzeroCoeffs(eliminated, i) > 1) break;
  }
  if (i == numRows - 1) throw "All-zero solution"; // Unique solution with all coefficients zero

  // Add an inhomogeneous equation
  eliminated[numRows - 1][i] = 1;
  eliminated[numRows - 1][numCols - 1] = 1;

  let coefs = extractCoefficients(gaussJordanEliminate(eliminated));

  let iterLeft = 10;

  console.log("first");
  console.log(coefs);
  while (coefs.find((c) => (c | 0) != c) && iterLeft-- > 0) {
    const scale = Math.min(...coefs.filter((c) => (c | 0) != c));
    const [a, b] = approxRational(scale);
    // coefs = coefs.map((c) => c / scale);
    coefs = coefs.map((c) => c * b);
    console.log(coefs);
  }

  return coefs;
};

function extractCoefficients(matrix: number[][]): Array<number> {
  const rows: number = matrix.length;
  const cols: number = matrix[0].length;

  if (cols - 1 > rows || matrix[cols - 2][cols - 2] == 0)
    throw "Multiple independent solutions";

  let lcm = 1;
  for (let i = 0; i < cols - 1; i++)
    lcm = (lcm / gcd(lcm, matrix[i][i])) * matrix[i][i];

  let coefs: Array<number> = [];
  let allzero = true;
  for (let i = 0; i < cols - 1; i++) {
    const coef = (lcm / matrix[i][i]) * matrix[i][cols - 1];
    coefs.push(coef);
    allzero = allzero && coef == 0;
  }
  if (allzero) throw "Assertion error: All-zero solution";
  return coefs;
}
