# FinApp - Gestão Financeira

Uma aplicação moderna e minimalista para gerenciar finanças pessoais, registrar receitas, despesas e investimentos, com relatórios em PDF e CSV.

## ✨ Funcionalidades

- **Dashboard Inteligente**: Acompanhe seu saldo atual, receitas e despesas do mês de forma clara.
- **Gestão de Transações**: Registre receitas, despesas e investimentos com descrição, valor, data e vencimento.
- **Navegação por Período**: Alterne facilmente entre os meses para conferir seu histórico.
- **Relatórios**: Exporte seus dados mensais para formatos PDF ou CSV com um clique.
- **Interface Elegante**: Tema Dark moderno com animações suaves e design responsivo.
- **Autenticação Segura**: Login via Google utilizando Firebase Authentication.
- **Sincronização em Tempo Real**: Seus dados são salvos com segurança no Firebase Firestore.

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **Vite**
- **Tailwind CSS** (v4)
- **Firebase** (Auth & Firestore)
- **Motion** (para animações)
- **Lucide React** (ícones)
- **Date-fns** (manipulação de datas)
- **jsPDF** & **json2csv** (geração de relatórios)

## 🚀 Como Começar

### Pré-requisitos

- Node.js (v18 ou superior)
- NPM ou Yarn

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/finapp.git
   cd finapp
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

### Configuração do Firebase

Para que a aplicação funcione fora do ambiente do AI Studio, você precisará configurar seu próprio projeto no Firebase:

1. Vá para o [Console do Firebase](https://console.firebase.google.com/).
2. Crie um novo projeto.
3. Ative o **Authentication** (método de login Google).
4. Ative o **Cloud Firestore**.
5. Registre uma nova aplicação Web e copie as credenciais.
6. Crie um arquivo `firebase-applet-config.json` na raiz do projeto (ou edite o existente) com suas credenciais:

```json
{
  "apiKey": "SUA_API_KEY",
  "authDomain": "SEU_PROJECT_ID.firebaseapp.com",
  "projectId": "SEU_PROJECT_ID",
  "storageBucket": "SEU_PROJECT_ID.appspot.com",
  "messagingSenderId": "SEU_SENDER_ID",
  "appId": "SEU_APP_ID",
  "firestoreDatabaseId": "(default)"
}
```

### Regras do Firestore

Aplique as regras de segurança do Firestore contidas no arquivo `firestore.rules` no console do seu projeto para garantir que cada usuário só possa acessar seus próprios dados.

### Execução

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build

Para gerar a versão de produção:

```bash
npm run build
```

## 📄 Licença

Este projeto está sob a licença MIT.
