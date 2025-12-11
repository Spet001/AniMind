# AniMind (MAL Edition)

App de recomendações de anime que cruza IA (Gemini) com dados oficiais do MyAnimeList. Funciona por descrição de gosto ou conectando seu usuário MAL.

[Demo pública](https://gemini.google.com/share/6ae852210638) · [Como rodar](#como-rodar-local) · [Deploy próprio](#build-e-deploy-próprios)

## Visão geral
- Dois modos: texto livre ou usuário MAL (se houver usuário salvo no browser, entra direto em modo MAL).
- IA (Gemini) gera 12 títulos em padrão oficial do MAL; depois o app busca capas, nota, sinopse, gêneros, episódios e status na API do MAL.
- Interface bilingue pt/en com toggle; UI moderna com background animado e cards interativos.

## Requisitos
- Node.js 18+.
- Chave da API do Gemini (obrigatória para qualquer recomendação).
- MAL Client ID válido (há um valor no código, mas use o seu para produção).

## Variáveis de ambiente (necessárias)
- `VITE_GEMINI_API_KEY=<sua-chave-gemini>`
- `VITE_MAL_CLIENT_ID=<seu-client-id>` (recomendado substituir o embutido)

## Como rodar (local)
1) Instale dependências: `npm install` ou `yarn`.
2) Crie `.env` com as variáveis acima (ou exporte-as no ambiente).
3) Ajuste a leitura das variáveis se preferir outro nome (arquivo principal: [One.jsx](One.jsx)).
4) Dev server: `npm run dev` (ou `yarn dev`).

## Fluxos
- Texto livre: usuário descreve o que quer → Gemini sugere 12 títulos → busca metadata no MAL → mostra cards.
- Usuário MAL: valida usuário → coleta top/concluídos → Gemini sugere 12 títulos não presentes → busca metadata no MAL → mostra cards.

## Build e deploy próprios
- Build: `npm run build` (ou `yarn build`).
- Publique a pasta gerada (ex.: `dist/` em projetos Vite) em host estático ou CDN.
- Configure as variáveis de ambiente do host com sua chave Gemini e MAL Client ID.

## Troubleshooting rápido
- Sem chave Gemini: a etapa de recomendações falha imediatamente.
- Lista MAL vazia/privada: o modo usuário retorna erro; deixe a lista pública ou use texto livre.
- Rate-limit MAL ou erro 4xx/5xx: o app tenta retry; considere um proxy/CORS próprio para produção.

## Onde alterar
- Toda a lógica (UI, toggle de idioma, chamadas Gemini e MAL, proxy) está em [One.jsx](One.jsx). Ajuste ali nomes de variáveis de ambiente, proxy CORS ou copy do layout.

## Licença
- Uso pessoal/estudos. Adapte conforme necessário.
