import { z } from 'zod';

export const searchSchema = z.object({
  lineCode: z
    .string()
    .min(1, 'Digite o código da linha')
    .regex(
      /^[0-9]{4}-[0-9]{2}$|^[0-9]{3}[A-Z]-[0-9]{2}$/,
      'Formato inválido. Use o padrão: 6824-10 ou 701U-10'
    )
    .transform((val) => val.toUpperCase()),
});

export type SearchFormData = z.infer<typeof searchSchema>;