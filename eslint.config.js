// Revisión de estilo y errores comunes (configuración oficial de Expo).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'tools/*', 'supabase/*', 'targets/*', 'node_modules/*'] },
  {
    // Reglas nuevas del compilador de React: avisan de patrones que impiden optimizar (p. ej. Animated.Value en useRef).
    // Se dejan como aviso y se irán corrigiendo pantalla a pantalla (auditoría A5/A7); no bloquean la publicación.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
