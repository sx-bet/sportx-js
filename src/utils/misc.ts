export function tryParseJson(maybeJson: string) {
  try {
    return {
      result: JSON.parse(maybeJson),
      valid: true
    };
  } catch (e) {
    return {
      result: undefined,
      valid: false
    };
  }
}
