# Guia de atualização do banco de perks

Para IAs e pessoas que forem atualizar o site. Leia tudo antes de editar.
O site é estático (GitHub Pages): sem servidor e sem banco externo. **A fonte da verdade é `data/perks.json`.**

## Arquivos
- `index.html`, `style.css`, `app.js`: o site. Qualquer mudança aqui entra no `CHANGELOG.md`.
- `data/perks.json`: perks e cores.
- `img/`: imagens opcionais (`"imagem": "img/16.png"`).
- `CHANGELOG.md`: histórico do site e do banco.

## Regra de ouro
Informação faltando = **BLANK**. Nunca invente valores: deixe `""` (ou `[]`) e o site mostra BLANK sem quebrar.
O JSON precisa continuar válido (confira vírgulas e aspas).

## Formato de um perk
```json
{
 "uid": "p-critical-plus",
 "id": 16,
 "nome": "Critical Plus",
 "cor": "vermelha",
 "abas": ["crítico", "dano"],
 "imagem": "",
 "valores": [25, 50, 75, 100],
 "original": "Disparos críticos possuem {v}% de dano a mais",
 "simples": "+{v}% dano crítico"
}
```
(Exemplo hipotético; números ilustrativos.)

- `uid`: identificador interno, único e permanente. As builds salvas apontam para ele. **Nunca mude nem reutilize.** Perk novo: texto único (ex.: `p-nome-do-perk`).
- `id`: posição do perk na lista do jogo. Pode mudar (regra abaixo). Vazio é aceito (aparece como `#?`).
- `nome`: vazio = BLANK.
- `cor`: chave de `cores` (ex.: `vermelha`). O catálogo é agrupado por cor.
- `abas`: lista de tags. Cada tag é uma aba (maiúsculas e acentos não importam). Abas fixas: Tiro, Faca, Corrida, Explosão, Sniper, Metralhadoras. Qualquer outra tag cria uma aba nova sozinha. Um perk com várias tags aparece em todas as abas dele.
- `imagem`: caminho opcional. Sem imagem, o site mostra uma caixa com o número do ID.
- `valores`: até 4 números (níveis 1 a 4) que substituem `{v}`.
- `original`: texto do jogo, copiado sem reescrever (uso futuro por IA).
- `simples`: versão curta e direta. Ex.: original "Seus disparos com arma de fogo têm o dano aumentado em 12%" → simples "12% de dano a mais para tiros."

`original` e `simples` aceitam texto único (vale para todos os níveis; use `{v}`) ou um objeto por nível: `{"1": "...", "2": "...", "3": "...", "4": "..."}`. Nível sem texto, ou `{v}` sem valor, vira BLANK.

## Regra de ID (inserir perk no meio)
Se o perk novo deve ficar no ID N e esse ID já está em uso, todos os perks com `id` >= N sobem +1 (o 6 vira 7, o 7 vira 8...) e o novo recebe o N. Nunca altere `uid`. Excluir um perk deixa um buraco nos IDs (só reorganize se pedirem). Os IDs não precisam ser contínuos por cor.

## Cores
Em `cores`: `"chave": {"nome": "Vermelhos", "hex": "#d83a3a"}`. Chave em minúsculas e sem acento. A ordem das chaves é a ordem das seções no site. Cor nova: adicione a chave aqui.

## Passo a passo
1. Leia o `data/perks.json` atual do repositório.
2. Aplique as mudanças seguindo as regras acima.
3. Aumente `versao` (ex.: 0.1.0 → 0.1.1).
4. Valide: JSON válido, `uid` únicos, `cor` existente em `cores`, nada inventado.
5. Registre no `CHANGELOG.md`.
6. Faça o commit.

## Rascunho local
O menu "Gerenciar perks" salva só no navegador (rascunho). Para publicar: Exportar `perks.json`, substituir `data/perks.json` no repositório e fazer commit.
