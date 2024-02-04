import { getInput, getMultilineInput } from '@actions/core';

export interface Inputs {
  maxAttempts: number;
  command: string;
  flakyTestOutputLines: string[];
}

export function getInputNumber(id: string): number {
  const input = getInput(id, { required: true });
  const num = Number.parseInt(input);

  if (!Number.isInteger(num)) {
    throw `Input ${id} only accepts numbers.  Received ${input}`;
  }

  return num;
}

export function getInputs(): Inputs {
  const max_attempts = getInputNumber('max_attempts');
  const command = getInput('command', { required: true });
  const flakyTestOutputLines = getMultilineInput('flaky_test_output_lines');

  return {
    maxAttempts: max_attempts,
    command,
    flakyTestOutputLines: flakyTestOutputLines,
  };
}
