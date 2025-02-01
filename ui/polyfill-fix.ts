(window as any).global = window; // semicolon required here
(window as any).process = {
  env: { DEBUG: undefined },
}
