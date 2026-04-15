import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        azul:           'rgb(var(--azul)           / <alpha-value>)',
        'azul-hover':   'rgb(var(--azul-hover)     / <alpha-value>)',
        'azul-claro':   'rgb(var(--azul-claro)     / <alpha-value>)',
        'azul-medio':   'rgb(var(--azul-medio)     / <alpha-value>)',
        'azul-suave':   'rgb(var(--azul-suave)     / <alpha-value>)',
        rojo:           'rgb(var(--rojo)           / <alpha-value>)',
        'rojo-hover':   'rgb(var(--rojo-hover)     / <alpha-value>)',
        'rojo-claro':   'rgb(var(--rojo-claro)     / <alpha-value>)',
        'rojo-borde':   'rgb(var(--rojo-borde)     / <alpha-value>)',
        'gris-bg':      'rgb(var(--gris-bg)        / <alpha-value>)',
        'gris-borde':   'rgb(var(--gris-borde)     / <alpha-value>)',
        texto:          'rgb(var(--texto)          / <alpha-value>)',
        'texto-suave':  'rgb(var(--texto-suave)    / <alpha-value>)',
        'texto-tenue':  'rgb(var(--texto-tenue)    / <alpha-value>)',
        verde:          'rgb(var(--verde)          / <alpha-value>)',
        'verde-bg':     'rgb(var(--verde-bg)       / <alpha-value>)',
        'verde-borde':  'rgb(var(--verde-borde)    / <alpha-value>)',
        naranja:        'rgb(var(--naranja)        / <alpha-value>)',
        'naranja-bg':   'rgb(var(--naranja-bg)     / <alpha-value>)',
        'naranja-borde':'rgb(var(--naranja-borde)  / <alpha-value>)',
      },
      fontFamily: {
        sans:  ['IBM Plex Sans', 'sans-serif'],
        serif: ['Source Serif 4', 'serif'],
        mono:  ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
