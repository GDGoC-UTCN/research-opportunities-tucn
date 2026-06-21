/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * When set to "true", Browse falls back to bundled MOCK_OPPORTUNITIES for
   * local demos. Production builds must leave this unset / "false" so only real
   * database opportunities are shown.
   */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
