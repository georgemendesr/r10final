import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'poppins': ['Poppins', 'sans-serif'],
				'rubik': ['Rubik', 'sans-serif'],
				'title': ['Poppins', 'sans-serif'],
				'body': ['Rubik', 'sans-serif'],
			},
			colors: {
				brand: '#C62828', /* Vermelho mais escuro para contraste 4.5:1 */
				bannerGray: '#444444',
				breakingRed: '#D50000',
				neutral50: '#FAFAFA',
				neutral900: '#1A202C',
				// Cores das editorias (ajustadas para acessibilidade)
				'ed-policia': '#C62828',
				'ed-politica': '#7A1F2B',
				'ed-esporte': '#0D7A47',
				'ed-entretenimento': '#BF360C',
				'ed-geral': '#424242',
				// Variáveis CSS para shadcn/ui
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'scroll': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-100%)' }
				},
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slideIn': {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'highlight-pulse': {
					'0%, 100%': { 
						opacity: '1',
						backgroundColor: 'rgb(254 202 202)',
						borderColor: 'rgb(248 113 113)'
					},
					'50%': { 
						opacity: '0.7',
						backgroundColor: 'rgb(252 165 165)',
						borderColor: 'rgb(239 68 68)'
					}
				},
				highlightPulse: {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'scroll': 'scroll 20s linear infinite',
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-out',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'highlight-pulse': 'highlight-pulse 2s ease-in-out infinite',
				'highlightPulse': 'highlightPulse 2s ease-in-out infinite',
			}
		}
	},
	    plugins: [],
} satisfies Config;
