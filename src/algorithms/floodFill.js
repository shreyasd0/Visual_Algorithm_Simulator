export function floodFillGrid(grid, startRow, startCol, newColor, oldColor = null) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[startRow, startCol]];
  const steps = [];

  const targetColor = oldColor ?? grid[startRow][startCol];

  if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
    return { steps: [], visited, filled: false, reason: 'Start position is outside the grid.' };
  }

  if (targetColor === newColor) {
    return { steps: [], visited, filled: false, reason: 'Target and replacement color are identical.' };
  }

  while (stack.length > 0) {
    const [row, col] = stack.pop();

    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      continue;
    }

    if (visited[row][col]) {
      continue;
    }

    if (grid[row][col] !== targetColor) {
      continue;
    }

    visited[row][col] = true;
    grid[row][col] = newColor;
    steps.push({ step: steps.length + 1, row, col, color: newColor });

    stack.push([row + 1, col]);
    stack.push([row - 1, col]);
    stack.push([row, col + 1]);
    stack.push([row, col - 1]);
  }

  return {
    steps,
    visited,
    filled: true,
    rows,
    cols,
  };
}
