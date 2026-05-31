import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Palette Airbus — construite autour du bleu de marque #00205B.
 * Les tokens `primary.*` sont exposés en CSS vars (`--p-primary-500`, etc.)
 * et réutilisables aussi par les composants custom.
 */
export const AirbusPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#e6ecf3',
      100: '#bfcde0',
      200: '#94abc9',
      300: '#6889b2',
      400: '#3d6f9f',
      500: '#00205B', // Airbus Blue
      600: '#001d52',
      700: '#001947',
      800: '#00153c',
      900: '#000d2a',
      950: '#00081b'
    },

    // --- Rayons globaux (s'applique à TOUS les composants PrimeNG) ----------
    borderRadius: {
      none: '0',
      xs:   '2px',
      sm:   '4px',
      md:   '6px',
      lg:   '10px',
      xl:   '14px'
    },

    // --- Focus ring unifié (accessibilité + identité visuelle) --------------
    focusRing: {
      width:  '2px',
      style:  'solid',
      color:  '{primary.500}',
      offset: '2px',
      shadow: 'none'
    },

    // --- Champs de formulaire : densité homogène, full-width par défaut ----
    formField: {
      paddingX:     '0.75rem',
      paddingY:     '0.5rem',
      borderRadius: '{border.radius.md}',
      sm: { fontSize: '0.875rem', paddingX: '0.625rem', paddingY: '0.375rem' },
      lg: { fontSize: '1.125rem', paddingX: '0.875rem', paddingY: '0.625rem' }
    },

    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}'
        },
        highlight: {
          background: '{primary.500}',
          focusBackground: '{primary.600}',
          color: '#ffffff',
          focusColor: '#ffffff'
        }
      },
      dark: {
        primary: {
          color: '{primary.500}',
          contrastColor: '{primary.950}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.500}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.500}, transparent 76%)',
          color: '{primary.50}',
          focusColor: '{primary.50}'
        }
      }
    }
  },

  // --- Overrides par composant (uniquement quand un token semantic ne suffit pas) ---
  components: {
    card: {
      // Cartes plus compactes que le défaut Aura
      body: { padding: '1.25rem' },
      title: { fontSize: '1rem', fontWeight: '600' }
    }
  }
});
