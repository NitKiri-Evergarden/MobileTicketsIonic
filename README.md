# MobileTicketsIonic

Controle de Atendimento (MobileTicketsIonic):

# Sistema de Controle de Atendimento - Totem + Guichês

Sistema moderno de gerenciamento de senhas e filas de atendimento, desenvolvido com **Angular + Ionic**.

Ideal para clínicas, laboratórios, bancos, repartições públicas e qualquer ambiente que precise controlar fluxo de atendimento com senhas prioritárias, gerais e exames.

---

## ✨ Funcionalidades

### Totem (Agente Cliente)
- Emissão de três tipos de senha:
  - **SP** – Senha Prioritária
  - **SG** – Senha Geral
  - **SE** – Senha para Exames
- Geração automática de número no formato: `YYMMDD-TIPOXX` (ex: `251121-SP07`)
- 5% de chance simulada de não comparecimento (descarte automático)

### Guichês (Agente Atendente)
- 3 guichês simultâneos
- Sistema inteligente de chamada com alternância de prioridade
- Prioridade lógica:
  - Após chamar uma senha prioritária (SP) → chama não prioritária (preferencialmente SE)
  - Após chamar não prioritária → chama SP (se disponível)
- Tempo de atendimento simulado com variação realista
- Finalização automática ou manual do atendimento

### Painel em Tempo Real
- Visualização das filas de espera (SP, SG, SE)
- Últimas 5 senhas chamadas
- Horário atual simulado (inicia às 07:00)

### Relatórios
- **Relatório Diário** completo com:
  - Quantidade de senhas emitidas e atendidas
  - Quebra por tipo (SP, SG, SE)
  - Tempo Médio de Atendimento (TM) por tipo
  - Lista detalhada de todas as senhas
- **Relatório Mensal** consolidado

### Outras Funcionalidades
- Abertura e encerramento automático do expediente (07h às 17h)
- Notificações sonoras ao chamar senha (quando permitido)
- Descarte automático de senhas restantes ao encerrar o expediente

---

## 🛠️ Tecnologias Utilizadas

- **Angular 17+** (Standalone Components + Signals)
- **Ionic Framework** (Componentes UI modernos)
- **TypeScript**
- **SCSS** (estilização avançada)
- **RxJS** (via Signals e effects)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Angular CLI (`npm install -g @angular/cli`)
- Ionic CLI (`npm install -g @ionic/cli`)

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seuusuario/mobile-tickets-ionic.git
cd mobile-tickets-ionic

# 2. Instale as dependências
npm install

# 3. Execute o projeto
ng serve
Acesse no navegador: http://localhost:4200
```
📁 Estrutura de Pastas
src/app/
├── app.component.ts          # Lógica principal do sistema
├── app.component.html        # Template Ionic
├── app.component.scss        # Estilos personalizados
└── app.component.spec.ts     # Testes unitários

🎯 Regras de Negócio Implementadas

Sequência diária por tipo de senha (reinicia ao abrir expediente)
Alternância inteligente entre senhas prioritárias e não prioritárias
Tempo de atendimento variável:
SP: ~15 minutos (±5 min)
SG: ~5 minutos (±3 min)
SE: 1 minuto (95%) ou 5 minutos (5%)

Fechamento automático às 17h com descarte de senhas restantes
Relatórios precisos com cálculo de TM (Tempo Médio)


🔧 Possíveis Melhorias Futuras

Integração com banco de dados (Firebase / Supabase)
Suporte a múltiplos dias com persistência
Versão PWA instalável
Impressão de senha via totem
Chamada por voz (Text-to-Speech)
Dashboard administrativo com gráficos
Autenticação de usuários (Atendentes)


📄 Licença
Este projeto foi desenvolvido para fins educacionais e demonstrativos.

Desenvolvido com ❤️ usando Angular + Ionic
Qualquer dúvida ou sugestão, fique à vontade para abrir uma Issue!

---

### Como usar:

1. Crie o arquivo `README.md` na **raiz** do projeto.
2. Cole todo o conteúdo acima.
3. Salve e faça o commit:

```bash
git add README.md
git commit -m "docs: add detailed README.md"
git push origin main
