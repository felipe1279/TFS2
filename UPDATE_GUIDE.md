# UPDATE_GUIDE — instruções operacionais para a IA

Gatilho: o usuário envia "ATUALIZAR BASE TFS2". Use apenas este guia, os arquivos da pasta e fontes web. Não dependa de conversas anteriores e use sempre a versão mais recente do Drive.

## 1. Arquivos
- `data/perks.json`: array JSON de perks (fonte da verdade).
- `data/builds.json`: builds do usuário (somente leitura para você).
- `data/tags.json`: cores, categorias, atributos e vocabulário permitido.
- `docs/SOURCES.md` e `docs/CHANGELOG.md`: registre aqui fontes e alterações.
- `assets/perks/`: ícones, um arquivo por perk.

## 2. Campos de um perk
- `id`: slug único e estável. Nunca renomeie.
- `nome`: nome oficial. `cor`: vermelha, azul, verde, amarela ou roxa. A cor é fixa, definida pelo jogo.
- `descricao_original`: texto do jogo, sem reescrever.
- `descricao_simples`: uma frase objetiva, mantendo condições, penalidades e limitações. Vazio significa pendente.
- `niveis`: efeito de cada nível ("1" a "4").
- `categorias`: chaves de `tags.json`. Um perk pode ter várias. São índice de busca, não regra de compatibilidade. Classifique pelo efeito, não só pelo nome.
- `atributos`: `[{tipo, valor, unidade, nivel, acumulacao, rotulo}]`, uma entrada por nível; `rotulo` é o nome do efeito como aparece no jogo. `acumulacao` é aditiva, multiplicativa, outra ou desconhecida. Nunca presuma que percentuais semelhantes se somam.
- `condicoes`, `restricoes`: listas de texto. Perks de bloqueio (locking) levam a restrição de que não podem ser desequipados até o fim da partida.
- `imagem`: `{arquivo, fonte, status}` com status encontrada ou pendente.
- `revisao`: `{descricao, categorias, sinergias, imagem, status}`. Cada item é pendente ou verificado. `status` é incompleto, em_analise ou verificado.
- `fontes`: `[{url, data, nota}]`. `ultima_verificacao`: AAAA-MM-DD ou null.

Campos podem ficar vazios. Nunca invente valores: vazio é melhor que palpite.

## 3. Sinergias
Formato, registrado nos dois perks envolvidos:
`{"com":"id","tipo":"","estado":"","efeito_este":"","efeito_outro":"","motivo":"","condicoes":"","limitacoes":"","teste":"confirmada_no_jogo|precisa_teste"}`

- `tipo`: complementar, amplificadora, habilitadora, condicional, conflitante ou redundante.
- `estado`: candidata, em_analise, verificada ou rejeitada. Só use verificada com confirmação em fonte ou no jogo.
- Método: (1) delimite candidatos pelas categorias; (2) leia descrição original, simples, níveis, condições, restrições e atributos; (3) compare os efeitos mecanicamente. Perks de outras categorias entram só se as descrições mostrarem interação real.
- Não registre coincidência de palavra-chave ou de atributo. Não preencha relações só para completar o JSON. Rejeitadas ficam registradas para não serem reavaliadas.

## 4. Procedimento
1. Leia este guia inteiro. 2. Leia `perks.json` e `tags.json` antes de analisar.
3. Liste pendências: perks novos, descrição simples vazia, sem categorias, atributos incompletos, sinergias não investigadas, imagens pendentes, dados sem verificação recente.
4. Para cada perk novo ou desatualizado: confirme o nome oficial, a descrição, os níveis, condições e limitações em fontes de The Final Stand 2 (ordem em `SOURCES.md`). Registre a data. Se as fontes divergirem, registre a divergência em `fontes` em vez de escolher um valor.
5. Escreva a `descricao_simples` onde estiver vazia. 6. Defina as categorias. 7. Investigue sinergias (seção 3).
8. Procure o ícone correto de The Final Stand 2, nunca de outro jogo e nunca gerado. Se achar, registre em `imagem.fonte` a URL direta do arquivo de imagem (o script `tools/download-images.js` a baixa na máquina do usuário e preenche `arquivo` e `status`); se só houver a página, registre a página e mantenha pendente. Se não achar, mantenha pendente.
9. Valide: JSON válido, ids únicos, sem duplicatas, níveis, categorias existentes em `tags.json`, atributos, fontes e estados de revisão coerentes.
10. Entregue: novo `perks.json`, relatório de alterações, lista de pendências e entrada no `CHANGELOG.md`.

## 5. Cuidados
- Preserve registros com `revisao.status` verificado que não mudaram. Não sobrescreva edições do usuário em silêncio: se houver conflito, aponte no relatório.
- Faça cópia de segurança antes de substituir o arquivo. Com permissão de escrita no Drive, atualize o arquivo; sem ela, entregue o JSON para substituição manual.
- A atualização só está concluída depois da validação do arquivo final.

## 6. Sem acesso ao Drive
Se a base chegar como `tfs2-base-para-ia.md` (anexo ou texto colado), trabalhe com ela e com fontes web.
- Em "ATUALIZAR BASE TFS2", devolva um array JSON de atualização dentro de um bloco de código, com um objeto por perk alterado: `id` e só os campos que mudam. Perk novo precisa de `id`, `nome` e `cor`.
- `sinergias` e `fontes`: envie só as entradas novas ou alteradas; o app faz upsert por `com` e por `url`. Nos demais campos, o valor enviado substitui o atual.
- Sinergias entram nos dois perks envolvidos. Depois do JSON, liste em texto o que continua pendente.
