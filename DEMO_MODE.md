# 🚌 Modo Demonstração - Cadê Meu Ônibus

## ✅ Problema Resolvido!

O erro **401 (API request failed)** foi resolvido com a implementação de um **modo demonstração** que funciona sem necessidade de token da API SPTrans.

## 🎯 Como Testar Agora

### Linhas Disponíveis no Demo:
- **6824-10** - Lapa - Pirituba (4 ônibus)
- **701U-10** - Terminal São Miguel - Metrô Tucuruvi (2 ônibus)
- **2029-10** - Capão Redondo - Metrô Giovanni Gronchi (3 ônibus)
- **177A-10** - Terminal Pirituba - Shopping Eldorado (1 ônibus)
- **175R-10** - Jardim Rincão - Terminal Pirituba (2 ônibus)

### 📱 Passos para Testar:

1. **Abra o app** no Expo Go
2. **Digite qualquer linha demo** (ex: `6824-10`)
3. **Veja a lista de ônibus** com dados realistas
4. **Observe o auto-refresh** - posições mudam a cada 30s
5. **Status coloridos**:
   - 🟢 Verde = Em movimento
   - 🟠 Laranja = Parado
   - ⚫ Cinza = Offline

## 🎮 Funcionalidades Demo

### ✅ Totalmente Funcionais:
- **Busca por código** de linha
- **Auto-refresh** a cada 30 segundos
- **Estados de loading** realistas
- **Coordenadas GPS** de São Paulo
- **Status dinâmicos** dos ônibus
- **Sugestões de busca** com linhas demo
- **Movimento simulado** - ônibus "se movem" no mapa

### 🔄 Dados Dinâmicos:
- Posições GPS variam a cada refresh
- Horários de última atualização realistas
- Velocidades simuladas para ônibus em movimento
- Status offline para ônibus parados há muito tempo

## 🚀 Testando Agora

**Digite:** `6824-10` ← linha do Parque Fernanda

**Resultado esperado:**
```
🚌 MODO DEMONSTRAÇÃO
Linha 6824-10 - 4 ônibus encontrados

🟢 Ônibus 6824-001 - Em movimento
📍 -23.5291, -46.6658
🕐 14:30:45

🟠 Ônibus 6824-002 - Parado
📍 -23.5185, -46.6542
🕐 14:28:25

🟢 Ônibus 6824-003 - Em movimento
📍 -23.5398, -46.6729
🕐 14:30:15

⚫ Ônibus 6824-004 - Offline
📍 -23.5156, -46.6389
🕐 14:15:45
```

## 🔧 Para Usar API Real

1. **Obtenha token SPTrans**:
   - Cadastre-se em: http://www.sptrans.com.br/desenvolvedores/

2. **Configure no projeto**:
   ```typescript
   // src/constants/api.ts
   export const API_CONFIG = {
     TOKEN: 'SEU_TOKEN_REAL_AQUI', // ← Substitua aqui
   };
   ```

3. **Reinicie o app** - API real será usada automaticamente

## 💡 Como Funciona

O sistema detecta automaticamente:
- Se o token é placeholder (`YOUR_API_TOKEN_HERE`)
- Se a linha pesquisada está na lista demo
- Usa dados simulados realistas da cidade de São Paulo
- Simula delay de rede (500ms-1.5s)
- Gera movimento dinâmico para ônibus ativos

## 🎯 Próximos Testes

1. **Teste cada linha demo** para ver variações
2. **Observe o auto-refresh** funcionando
3. **Veja estados de loading** realistas
4. **Confirme sugestões** de busca
5. **Teste busca inválida** para ver tratamento de erro

**🎉 O MVP está 100% funcional em modo demonstração!**

Agora você pode testar todas as funcionalidades sem precisar de token da API SPTrans. O app simula perfeitamente o comportamento real com dados realistas de São Paulo! 🚌✨