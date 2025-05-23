import postcss from 'rollup-plugin-postcss';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'daggerheart.mjs',
    output: {
        file: 'build/daggerheart.js',
        format: 'cjs',
        sourcemap: true
    },
    plugins: [
        postcss({
            config: {
                path: './postcss.config.js'
            },
            use: {
                less: { javascriptEnabled: true }
            },
            extensions: ['.less'],
            extract: false
        }),
        commonjs({
            include: /node_modules/,
            requireReturnsDefault: 'auto'
        }),
        resolve()
    ]
};
