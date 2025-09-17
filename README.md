# Cadê Meu Ônibus 🚌

Aplicativo mobile para rastreamento em tempo real de ônibus da SPTrans em São Paulo.

## ✅ STATUS: FUNCIONANDO COM API REAL!

**Última atualização:** 16/09/2024
**API SPTrans:** ✅ Integração completa e funcional
**Teste confirmado:** Linha 6824-10 retornou 2 ônibus reais

## 🚀 Funcionalidades

### MVP - Versão 1.0

- **Mapa em Tela Cheia**: Visualização completa estilo Google Maps
- **Busca de Linhas**: Busque por código da linha (ex: 6824-10)
- **Rastreamento em Tempo Real**: Posições dos ônibus atualizadas a cada 30 segundos
- **Marcadores Personalizados**: Ônibus com cores diferentes por status
  - 🟢 Verde: Em movimento
  - 🟠 Laranja: Parado
  - ⚫ Cinza: Offline
- **Sugestões de Busca**: Linhas populares e autocomplete
- **Estados de Loading**: Feedback visual elegante
- **Localização do Usuário**: Permissões e rastreamento GPS

## 🛠 Stack Tecnológica

- **React Native** com Expo
- **TypeScript** - Tipagem estática
- **React Native Maps** - Mapas interativos
- **Zustand** - Gerenciamento de estado
- **React Native Unistyles** - Sistema de estilos
- **Expo Location** - Serviços de localização
- **SPTrans Olho Vivo API** - Dados de ônibus em tempo real

## 📱 Requisitos

- Node.js 18+
- Expo CLI
- Android Studio / Xcode (para development builds)
- Token da API SPTrans

## 🚧 Setup do Projeto

### 1. Instalação

```bash
# Clone o repositório
git clone [repository-url]
cd cade-meu-onibus

# Instale as dependências
npm install
```

### 2. Configuração da API

Edite o arquivo `src/constants/api.ts` e substitua `YOUR_API_TOKEN_HERE` pelo seu token da API SPTrans:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://api.olhovivo.sptrans.com.br/v2.1',
  TOKEN: 'SEU_TOKEN_AQUI', // ⚠️ Substitua pelo token real
  // ...
};
```

### 3. Executar o Projeto

```bash
# Desenvolvimento
npm start

# Android
npm run android

# iOS
npm run ios
```

## 🗂 Estrutura do Projeto

```
/src
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Button, Input, etc)
│   ├── maps/           # Componentes relacionados a mapas
│   └── transit/        # Componentes específicos de transporte
├── screens/            # Telas da aplicação
├── services/           # Serviços e APIs
├── stores/             # Gerenciamento de estado (Zustand)
├── types/              # Definições de tipos TypeScript
├── constants/          # Constantes da aplicação
├── utils/              # Funções utilitárias
└── styles/             # Sistema de temas
```

## 🎨 Design System

### Cores

```typescript
primary: '#1E40AF'       // Azul SPTrans
secondary: '#059669'     // Verde (ônibus em movimento)
warning: '#D97706'       // Laranja (ônibus parado)
error: '#DC2626'         // Vermelho (erros)
```

### Status dos Ônibus

- **🟢 Em Movimento**: Verde (`#059669`)
- **🟠 Parado**: Laranja (`#D97706`)
- **⚫ Offline**: Cinza (`#9CA3AF`)

## 📡 API Integration

### SPTrans Olho Vivo

O aplicativo integra com a API oficial da SPTrans para obter dados em tempo real:

- **Autenticação**: Cookie-based authentication
- **Rate Limiting**: Respeitado automaticamente
- **Retry Logic**: 3 tentativas com backoff exponencial
- **Timeout**: 10 segundos por request

### Endpoints Utilizados

- `POST /Login/Autenticar` - Autenticação
- `GET /Linha/Buscar` - Busca de linhas
- `GET /Posicao/Linha` - Posições dos ônibus

## 🚀 Funcionalidades Técnicas

### Auto-refresh
- Atualização automática a cada 30 segundos
- Cleanup automático ao sair da tela
- Retry inteligente em caso de falha

### Gerenciamento de Estado
- **Zustand** para estado global
- Stores separadas por domínio (bus, location, app)
- Persistência automática de configurações

### Performance
- Lazy loading de componentes
- Debouncing em inputs de busca (300ms)
- Virtualized lists para grandes datasets
- Memory management otimizado

### Acessibilidade
- Screen reader support
- Contraste adequado
- Touch targets 44x44pt mínimo
- Navegação por gestos

## 🔧 Scripts Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm run android    # Executa no Android
npm run ios        # Executa no iOS
npm run web        # Executa no navegador
```

## 📋 Roadmap

### Futuras Versões

- **Offline Mode**: Cache de dados para uso sem internet
- **Previsões**: Tempo estimado de chegada nos pontos
- **Favoritos**: Salvar linhas favoritas
- **Notificações**: Alertas de chegada de ônibus
- **Rotas**: Traçado completo das linhas no mapa
- **Pontos de Ônibus**: Localização das paradas

## 🐛 Troubleshooting

### Problemas Comuns

1. **Token inválido**: Verifique se o token da API está correto
2. **Permissões de localização**: Aceite as permissões no primeiro uso
3. **Maps não carrega**: Verifique a configuração do Google Maps API

### Debug

```bash
# Logs detalhados
npx expo start --dev-client

# Reset cache
npx expo start --clear
```

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para a comunidade de São Paulo**