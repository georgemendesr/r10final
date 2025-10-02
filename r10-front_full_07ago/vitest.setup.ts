import '@testing-library/jest-dom/vitest';

globalThis.fetch = globalThis.fetch ?? (() => Promise.reject(new Error('global fetch não configurado para testes.')));
