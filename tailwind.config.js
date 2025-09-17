/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',   // Muito claro para backgrounds
          100: '#fee2e2',  // Claro para hover states
          200: '#fecaca',  // Médio claro
          300: '#fca5a5',  // Médio
          400: '#f87171',  // Médio escuro
          500: '#b91c1c',  // PRINCIPAL - vermelho vinho SPTrans
          600: '#991b1b',  // Escuro para hover
          700: '#7f1d1d',  // Mais escuro
          800: '#6b1f1f',  // Muito escuro
          900: '#581c1c',  // Extremamente escuro
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: '#10b981', // Verde para ônibus em operação
        warning: '#f59e0b', // Para atrasos ou manutenção
        info: '#3b82f6',    // Para rotas, informações
      },
    },
  },
  plugins: [],
}