/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // nova funcionalidade
        'fix',      // correção de bug
        'docs',     // documentação
        'style',    // formatação (não altera código)
        'refactor', // refatoração
        'perf',     // performance
        'test',     // testes
        'build',    // build ou dependências
        'ci',       // CI/CD
        'chore',    // tarefas diversas
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 200],
  },
};
