export function runIngest() {
  console.log('Ingest complete (no-op for baseline without artifacts)');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runIngest();
}
