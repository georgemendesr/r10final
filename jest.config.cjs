module.exports = {
  testEnvironment: 'node',
  // Restrinja aos testes na raiz para evitar pegar pastas legadas/corrompidas
  testMatch: ['<rootDir>/__tests__/**/*.test.cjs'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/server/__tests__/',
    '<rootDir>/r10-resgate/',
    '<rootDir>/backup',
    '<rootDir>/recovery',
    '<rootDir>/r10-front',
    '<rootDir>/r10-front_full',
  ],
  collectCoverageFrom: [
    '<rootDir>/server/**/*.cjs',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ]
};
