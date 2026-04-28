export default [
    {
        ignores: ['dist/', 'node_modules/', 'js/data/']
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                URL: 'readonly',
                HTMLElement: 'readonly',
                Node: 'readonly',
                Event: 'readonly',
                Promise: 'readonly',
                caches: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                Headers: 'readonly',
                Blob: 'readonly',
                JSON: 'readonly',
                Math: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                crypto: 'readonly',
                btoa: 'readonly',
                atob: 'readonly',
                Uint8Array: 'readonly',
                Array: 'readonly'
            }
        },
        rules: {
            // 可能的错误
            'no-undef': 'error',
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            'no-redeclare': 'error',
            'no-constant-condition': 'warn',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unreachable': 'error',
            'no-unsafe-negation': 'error',
            'no-implicit-globals': 'off', // 允许 window.xxx 赋值
            'no-global-assign': 'error',

            // 最佳实践
            'eqeqeq': ['warn', 'always'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-with': 'error',
            'no-return-assign': 'warn',
            'no-self-compare': 'error',
            'no-sequences': 'warn',
            'no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],

            // 代码风格（宽松，不强制）
            'semi': ['warn', 'always'],
            'no-extra-semi': 'warn',
            'no-trailing-spaces': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 2 }],
            'no-unexpected-multiline': 'error',

            // ES6+（项目已用 const/let，但允许 var 以兼容旧代码）
            'prefer-const': 'warn',
            'no-var': 'off',

            // 安全
            'no-script-url': 'error'
        }
    }
];
