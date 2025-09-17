# Formulários e Validação com Zod + React Hook Form

## 📋 Status Atual

### ✅ Implementado
- **SearchBar** (`src/components/ui/search-bar.tsx`)
  - Validação Zod para código de linha de ônibus
  - React Hook Form para controle do formulário
  - Watch para monitoramento em tempo real
  - Fechamento de dropdown ao clicar fora

## 🎯 Oportunidades de Implementação

### 1. Formulários de Configurações (Futuro)
- **Configurações de usuário**
  - Preferências de notificação
  - Raio de busca padrão
  - Linhas favoritas

### 2. Formulários de Feedback (Futuro)
- **Reportar problema**
  - Validação de campos obrigatórios
  - Validação de email
  - Limite de caracteres na descrição

### 3. Formulários de Filtros (Futuro)
- **Filtros de busca avançada**
  - Validação de critérios de busca
  - Validação de range de distância

## 🔧 Padrões Implementados

### Schema Zod
```typescript
// src/schemas/search.ts
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
```

### Hook Form Setup
```typescript
const {
  control,
  handleSubmit,
  watch,
  setValue,
  formState: { errors, isValid },
  trigger,
} = useForm<SearchFormData>({
  resolver: zodResolver(searchSchema),
  mode: 'onChange',
  defaultValues: {
    lineCode: '',
  },
});
```

### Watch para Monitoramento
```typescript
const watchedLineCode = watch('lineCode');

// Uso do watch para controlar estados
const showSuggestions = watchedLineCode.length > 0 && watchedLineCode.length < 7;
const showHistory = watchedLineCode.length === 0;
```

### TouchableWithoutFeedback para Fechar Dropdown
```typescript
<TouchableWithoutFeedback onPress={hideDropdowns}>
  <View className="z-50">
    {/* Conteúdo do formulário */}
  </View>
</TouchableWithoutFeedback>
```

## 💡 Benefícios Implementados

1. **Validação em Tempo Real**: Feedback imediato durante a digitação
2. **Type Safety**: Tipagem automática com TypeScript
3. **UX Aprimorada**: Fechamento automático de dropdowns
4. **Centralização**: Texto centralizado na barra de busca
5. **Performance**: Debounce para buscas automáticas
6. **Acessibilidade**: Estados visuais claros para validação

## 🔮 Próximos Passos

1. **Expandir validações**: Adicionar mais patterns de código de linha
2. **Formulários futuros**: Aplicar padrão em novos formulários
3. **Testes**: Adicionar testes para validações Zod
4. **Documentação**: Expandir exemplos de uso

## 📚 Dependências Adicionadas

```json
{
  "zod": "^3.25.76",
  "react-hook-form": "^7.62.0",
  "@hookform/resolvers": "^5.2.2"
}
```