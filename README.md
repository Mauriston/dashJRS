# Sistema de Controle de Inspeção de Saúde — Marinha do Brasil

Aplicação web (Vite + React + TypeScript) para o controle de Inspeções de Saúde da
Junta Regular de Saúde. O front-end é um site estático; os dados são lidos e gravados
em uma planilha do Google via um back-end em **Google Apps Script** (arquivo `code.gs`)
publicado como Web App.

## Arquitetura

- **Front-end:** SPA em React empacotada pelo Vite (saída estática em `dist/`).
- **Back-end:** Google Apps Script (`code.gs`) implantado como Web App. A URL de
  implantação fica configurada em `services/api.ts` (`API_URL`).

> O front-end conversa com o Apps Script via `fetch`. As leituras são feitas por `GET`
> e as escritas por `POST` com corpo `text/plain` (requisição CORS "simples", sem
> *preflight*), portanto a hospedagem estática no GitHub Pages funciona sem alterações
> no `code.gs`.

## Executar localmente

**Pré-requisitos:** Node.js 20+

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Rode em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Para gerar o build de produção e pré-visualizá-lo:
   ```bash
   npm run build
   npm run preview
   ```

## Publicação no GitHub Pages (GitHub Actions)

O deploy é automatizado pelo workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
A cada push no branch `main` (ou disparo manual em **Actions → Deploy to GitHub Pages**),
o site é construído e publicado.

### Configuração única do repositório

1. Acesse **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **GitHub Actions**.
3. Faça o merge das alterações para o branch `main`. O workflow será executado e
   publicará o site em `https://<usuario>.github.io/<repositorio>/`.

O Vite está configurado com `base: './'` (caminhos relativos), de modo que o app
funciona corretamente mesmo sendo servido a partir do subdiretório do repositório.

## Back-end (Google Apps Script)

O código do back-end está em `code.gs`. Caso a planilha ou a lógica de servidor mudem,
atualize esse arquivo no projeto do Apps Script e crie uma **nova implantação** (Deploy →
New deployment → Web app). Se a URL de implantação mudar, atualize `API_URL` em
`services/api.ts`.
