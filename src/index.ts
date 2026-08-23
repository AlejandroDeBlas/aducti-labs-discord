import { bootstrapApp } from './app.js';

bootstrapApp().catch((err) => {
  console.error('Fatal error starting application:', err);
  process.exit(1);
});
