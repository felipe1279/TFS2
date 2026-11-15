# CHANGELOG
Cada mudança no site (`index.html`, `style.css`, `app.js`) ou no banco (`data/perks.json`) vira um item aqui, do mais novo para o mais antigo.
Formato: `## versão (AAAA-MM-DD)` + lista curta. Mudou o banco? Aumente também `versao` em `data/perks.json`.

## 0.2.0 (2026-11-14)
- Banco 0.2.0: 144 perks catalogados a partir da wiki do jogo (finalstandtwo.fandom.com): 38 vermelhos, 19 azuis, 16 verdes, 15 amarelos, 6 roxos e 50 sem cor definida (nome confirmado, cor ainda desconhecida).
- 30 perks com valores dos níveis 1 a 4 (alguns só o nível 4); 95 com descrição do efeito; 49 só com o nome. O que não foi confirmado ficou BLANK.
- `original` traz o efeito em português, resumido a partir da wiki (não é cópia literal do texto do jogo).
- IDs provisórios (agrupados por cor). Sem imagens. Aba Metralhadoras ainda sem perks confirmados. Removidos os 3 perks de exemplo da 0.1.0.
- UPDATE_GUIDE: convenção de BLANK no texto, cor vazia, IDs provisórios e fontes.

## 0.1.0 (2026-11-14)
- Primeira versão: catálogo separado por cor, barra de nível 1–4, abas por tag, pesquisa e opção de ver o efeito original.
- Build com 12 slots, nível por perk, régua de essenciais/adicionais, recorte em imagem (copiar/baixar) e em texto, builds salvas no navegador.
- Gerenciar perks: criar, editar, excluir, criar caixas vazias por ID, inserir com reordenação de IDs, exportar/importar `perks.json`.
- Campo vazio aparece como BLANK e não quebra o site.
- Banco 0.1.0: 3 perks de exemplo (1 preenchido, 2 vazios). Apague ou substitua.