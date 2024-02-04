# retry

Retries an Action step on failure. Determines if a failure is a flake based on the test output

## Inputs

### `max_attempts`

**Required** Number of attempts to make before failing the step

### `command`

**Required** The command to run

### `flaky_test_output_lines`

**Optional** Specify which lines in output indicate that the failure is flaky. Note - if not specified, all failures are considered as real failures.

## Examples

```yaml
uses: oppia/retry@develop
with:
  max_attempts: 2
  flaky_test_output_lines: |
    First flaky line
    Second flaky line
  command: ./run_tests.sh
```

## Commands

`npm install` to install dependencies.

`npm run prepare` to build dist/index.js.

`npm test` to run tests.
