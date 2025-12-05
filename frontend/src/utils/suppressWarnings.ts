/**
 * Suppress known warnings that don't affect functionality
 */
export function suppressKnownWarnings() {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Known warnings to suppress
  const suppressedPatterns = [
    'Multiple instances of Three.js',
    'Unable to preventDefault inside passive event listener',
    'Added non-passive event listener',
    'width(-1) and height(-1)',
  ];

  const shouldSuppress = (message: string) => {
    return suppressedPatterns.some(pattern => message.includes(pattern));
  };

  // Filter out known warnings
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (shouldSuppress(message)) return;
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (shouldSuppress(message)) return;
    originalError.apply(console, args);
  };
}
