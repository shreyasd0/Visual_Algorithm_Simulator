export function createStepSequence(data, maxSteps = 20) {
  const sequence = [];
  const chunkSize = Math.max(1, Math.ceil(data.length / maxSteps));

  for (let index = 0; index < data.length; index += chunkSize) {
    sequence.push(data[index]);
  }

  return sequence;
}
