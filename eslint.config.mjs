import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // '@typescript-eslint/no-extra-semi' was removed in typescript-eslint v8; use the core rule instead.
      'no-extra-semi': 'error',
      // Newly enabled by the typescript-eslint v8 recommended set; was not enforced before the upgrade.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      // '@typescript-eslint/no-extra-semi' was removed in typescript-eslint v8; use the core rule instead.
      'no-extra-semi': 'error',
    },
  },
];
