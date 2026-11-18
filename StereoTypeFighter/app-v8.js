// Gym Bro V8.0 artwork release. Preserve historical routes and deterministic gameplay.
window.SF_RELEASE = Object.freeze({
  version:'8.0', channel:'stable', engine:'V7.2', fighterCount:20,
  artRelease:'gym-bro-v8-28-sprites', artManifest:'art/manifest-v8.json'
});
// Set release identity BEFORE importing the legacy game shell so it loads
// version-scoped images without changing V7/V7.1/V7.2 comparisons.
await import('./app-v7-1.js');
window.SF8 = window.SF7;
