export function runReport() {
  console.log('Report complete (no-op for baseline without artifacts)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReport();
}
