import 'jest';

import { runAction } from './action';
import { Inputs } from './inputs';
import * as fs from 'fs';

function generateRandomString(length: number): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    result += letters.charAt(randomIndex);
  }

  return result;
}

function createTempFile(content = ''): string {
  const fileName = `/tmp/${generateRandomString(10)}`;
  fs.writeFileSync(fileName, content);
  return fileName;
}

function assertFileContent(fileName: string, content: string) {
  const data = fs.readFileSync(fileName, 'utf-8');
  expect(data).toBe(content);
}

describe('retry', () => {
  let fileName = '';
  beforeEach(() => {
    fileName = createTempFile();
  });

  it('retries, fails', async () => {
    const inputs: Inputs = {
      maxAttempts: 3,
      command: `echo flake \\
                  && echo -n 1 >> ${fileName} \\
                  && false`,
      flakyTestOutputLines: ['another_flake', 'flake'],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(1);

    assertFileContent(fileName, '111');
  });

  it('succeeds', async () => {
    const inputs: Inputs = {
      maxAttempts: 3,
      command: `echo -n 1 >> ${fileName}`,
      flakyTestOutputLines: ['flake'],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(0);

    assertFileContent(fileName, '1');
  });

  it('succeeds without flaky lines', async () => {
    const inputs: Inputs = {
      maxAttempts: 3,
      command: `echo -n 1 >> ${fileName}`,
      flakyTestOutputLines: [],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(0);

    assertFileContent(fileName, '1');
  });

  it('succeeds after flake', async () => {
    const inputs: Inputs = {
      maxAttempts: 3,
      // command succeeds on the second run
      command: `echo flake \\
                  && echo -n 1 >> ${fileName} \\
                  && grep 11 ${fileName}`,
      flakyTestOutputLines: ['flake'],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(0);

    assertFileContent(fileName, '11');
  });

  it('detects real errors based on output', async () => {
    const inputs: Inputs = {
      maxAttempts: 3,
      command: `echo -n 1 >> ${fileName} \\
                  && echo 'real error, not flaky' \\
                  && false`,
      flakyTestOutputLines: ['flaky_string'],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(1);

    assertFileContent(fileName, '1');
  });

  it('detects real errors after flakes', async () => {
    // The second file is used to indicate the flake.
    const secondFileName = createTempFile('flaky_string');
    const inputs: Inputs = {
      maxAttempts: 3,
      // The first execution will output flaky_string.
      // The second execution will output 1 and should not be considered
      // as a flake.
      command: `cat ${secondFileName} \\
                  && echo 1 > ${secondFileName} \\
                  && echo -n 1 >> ${fileName} \\
                  && false`,
      flakyTestOutputLines: ['flaky_string'],
    };
    const exitCode = await runAction(inputs);
    expect(exitCode).toBe(1);

    // assert executed only twice
    assertFileContent(fileName, '11');
    fs.unlinkSync(secondFileName);
  });

  afterEach(() => {
    fs.unlinkSync(fileName);
  });
});
