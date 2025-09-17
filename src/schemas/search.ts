import { z } from 'zod';

export const searchSchema = z.object({
  lineCode: z
    .string()
    .min(1, 'Digite o código da linha')
    .regex(
      /^[0-9]{3,4}[A-Z]?-?[0-9]{2}$/,
      'Formato inválido. Use o padrão: 6824-10, 682410, 701U-10 ou 701U10'
    )
    .transform((val) => {
      const upper = val.toUpperCase();
      // Normalizar para formato com hífen se não tiver
      if (!/.*-.*/.test(upper)) {
        // Se não tem hífen, adicionar antes dos últimos 2 dígitos
        const match = upper.match(/^([0-9]{3,4}[A-Z]?)([0-9]{2})$/);
        if (match) {
          return `${match[1]}-${match[2]}`;
        }
      }
      return upper;
    }),
});

export type SearchFormData = z.infer<typeof searchSchema>;