import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Phaser alone is ~1.2 MB: its own chunk keeps our code small, and players
    // keep Phaser cached in the browser when only the game code changes.
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
        },
      },
    },
  },
});
