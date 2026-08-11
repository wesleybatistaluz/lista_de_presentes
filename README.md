# Site de Casamento — Júlia & Wesley

Site estático (HTML/CSS/JS puro, sem build) com página inicial + lista de presentes.

## Estrutura

```
index.html            Página inicial (foto + versículo, versículos, galeria,
                      cerimônia, contagem regressiva)
presentes.html        Lista de presentes
css/style.css         Estilo (paleta azul serenity)
js/main.js            Menu mobile + contagem regressiva
js/presentes-data.js  Os 37 itens da lista (nome, preço, foto, link, categoria)
js/presentes.js       Renderiza os cards e controla "já foi dado"
js/supabase-config.js Chaves do banco (Supabase) — já configurado
assets/img/casal/     Fotos do casal
assets/img/presentes/ Fotos dos produtos
assets/img/flora/     Flores decorativas (SVG)
```

Os arquivos de trabalho (prints originais da lista, fotos originais, script de
recorte) ficam fora desta pasta, em `../_originais_site_casamento/`, para não
irem para o site publicado.

## 1. Fotos do casal

Já estão em `assets/img/casal/`. Para trocar alguma, basta substituir o arquivo
mantendo o mesmo nome:

- `foto-historia.jpg` — foto grande da seção com o versículo
- `foto-01.jpg` até `foto-06.jpg` — galeria

## 2. Adicionar ou editar presentes

Cada presente é uma linha em `js/presentes-data.js`:

```js
{ id: "mesa-jantar", nome: "Mesa de Jantar 4 Lugares", preco: 719.90,
  categoria: "sala", unique: true, img: "mesa-jantar.webp",
  link: "https://br.shp.ee/SNzrJBJT" },
```

- **`link`** — a URL do anúncio. O botão de compra **detecta a loja pelo link**
  e mostra o texto certo: "Comprar na Shopee", "Comprar no Mercado Livre",
  "Comprar na Amazon" ou "Comprar no Magalu". Se o campo ficar vazio, o botão
  cai numa busca pelo nome do produto no Mercado Livre.
- **`img`** — o nome do arquivo dentro de `assets/img/presentes/`. Se o arquivo
  **ainda não existir**, o card mostra automaticamente a ilustração
  "foto em breve" (`_sem-foto.svg`) em vez de uma imagem quebrada. Assim que
  você salvar a foto com esse nome, ela aparece sozinha — não precisa mexer no
  código.
- **`preco`** — veja a seção 6.

### Tamanho das imagens

Salve as fotos dos produtos com no máximo **600 px** no lado maior. Os cards
exibem a imagem a ~211 px, então arquivos maiores que isso só deixam o site
mais lento sem melhorar nada. Formato `.webp` é o ideal.

## 3. Configurar o banco (Supabase) para o "já foi dado"

Isso é o que permite que, quando alguém marcar um presente grande (geladeira,
TV, etc.) como "já dado", ele fique bloqueado para os próximos visitantes —
mesmo que sejam de outro celular/computador.

1. Crie uma conta gratuita em https://supabase.com e crie um novo projeto.
2. Vá em **SQL Editor** e rode:

```sql
create table presentes_dados (
  id text primary key,
  claimed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table presentes_dados enable row level security;

create policy "leitura publica" on presentes_dados
  for select using (true);

create policy "insercao publica" on presentes_dados
  for insert with check (true);

create policy "qualquer um pode marcar ou desmarcar" on presentes_dados
  for update using (true) with check (true);
```

   Essa última política permite marcar E desmarcar (o site tem um botão
   "Marcou por engano? Desfazer" para quando alguém clica só para testar).
   Isso significa que, em teoria, qualquer visitante também poderia desmarcar
   um presente de propósito — para uma lista de casamento entre família e
   amigos esse risco é baixo, mas se quiser travar o "desmarcar" para acontecer
   só pelo painel do Supabase, troque o `with check (true)` por
   `with check (claimed = true)` e remova o botão de desfazer do site.

3. Vá em **Project Settings > API** e copie a **Project URL** e a **anon
   public key**.
4. Cole os dois valores em `js/supabase-config.js`.

Se você não configurar isso, o site continua funcionando normalmente (todos os
botões de compra funcionam, e o "Já dei este presente" ainda marca e desmarca),
só que a marcação fica salva apenas no navegador de quem clicou (via
localStorage) — não é compartilhada entre visitantes diferentes nem entre
dispositivos.

## 4. Publicar e atualizar

O site está publicado no GitHub Pages, a partir do repositório
`wesleybatistaluz/lista_de_presentes`:

**https://wesleybatistaluz.github.io/lista_de_presentes/**

Para publicar uma alteração:

```bash
git add -A && git commit -m "descreva a mudança" && git push
```

O GitHub Pages leva cerca de 1 a 2 minutos para republicar.

### ⚠️ Se a alteração não aparecer no site

Quase sempre é **cache do navegador**, não um erro. O navegador guarda os
arquivos `.js` e `.css` por alguns minutos e continua mostrando a versão antiga.

1. **Recarregue forçando a atualização:** `Ctrl + Shift + R` (ou `Ctrl + F5`).
   No celular, abra numa aba anônima.
2. **Para garantir que TODOS os visitantes vejam na hora**, troque a versão nos
   dois arquivos HTML. Procure por `?v=` em `index.html` e `presentes.html` e
   coloque a data de hoje:

   ```html
   <link rel="stylesheet" href="css/style.css?v=2026-08-11">
   <script src="js/presentes-data.js?v=2026-08-11"></script>
   ```

   Mudar esse número faz o navegador entender que é um arquivo novo e baixar de
   novo, em vez de usar o que está guardado. Vale a pena fazer isso sempre que
   você mexer na lista de presentes.

Para conferir rapidamente se o servidor já tem a versão nova (sem depender do
seu navegador), abra este endereço direto:
`https://wesleybatistaluz.github.io/lista_de_presentes/js/presentes-data.js`

Como o site é 100% estático e o banco (Supabase) é externo, **qualquer
hospedagem de site estático funciona igual** — não existe nada rodando no
servidor. Não precisa configurar build command nem output directory.

### Recomendado — Vercel conectado ao GitHub

Vantagem: depois de configurado, cada `git push` atualiza o site sozinho — útil
porque os links do Mercado Livre ainda vão ser preenchidos aos poucos.

1. Crie um repositório novo no GitHub (pode ser **privado**).
2. Suba esta pasta:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
3. Entre em https://vercel.com/new, faça login com o GitHub e importe o
   repositório. Aceite tudo como está e clique em **Deploy**.
4. Em **Settings > Domains** dá para trocar o endereço para algo como
   `julia-e-wesley.vercel.app`.

Para atualizar o site depois:

```bash
git add -A && git commit -m "atualiza links dos presentes" && git push
```

### Alternativa mais rápida — Netlify Drop

Se quiser ver no ar em dois minutos, sem git e sem instalar nada: abra
https://app.netlify.com/drop e arraste a pasta `site_lista_presentes` para a
página. Sai uma URL HTTPS na hora. Para atualizar, arrasta de novo.

### Alternativa — GitHub Pages

Funciona bem também. Suba o repositório (passos 1 e 2 acima) e vá em
**Settings > Pages > Source: branch `main`, pasta `/ (root)`**. O site fica em
`https://SEU_USUARIO.github.io/SEU_REPO/`. Atenção: no plano gratuito o
repositório precisa ser **público**.

## 5. Sobre a chave do Supabase ficar visível (é normal)

A chave em `js/supabase-config.js` é uma chave *publishable* (pública por
natureza): ela roda no navegador do visitante, então **fica visível no código
fonte do site em qualquer hospedagem** — isso é normal e esperado, não é um
vazamento.

Quem realmente protege os dados são as policies de RLS no Supabase. Com a
configuração atual, um visitante pode marcar e desmarcar presentes — o que é
justamente o comportamento desejado. O risco teórico é alguém mal-intencionado
marcar tudo como dado de propósito. Para uma lista compartilhada entre família e
amigos isso é bem improvável, e se acontecer é fácil desfazer: no painel do
Supabase, em **Table Editor > presentes_dados**, rode

```sql
update presentes_dados set claimed = false;
```

Se preferir eliminar esse risco por completo, remova o botão "Desfazer" do site
e troque a policy de update para `with check (claimed = true)` — aí ninguém
consegue desmarcar pelo site, só por esse painel.

## 6. Categorias e "presente único" x "pode repetir"

Em `js/presentes-data.js`, cada item tem:

- `categoria` → define em qual aba o item aparece e a tag colorida do card.
  Valores possíveis: `cozinha`, `utensilios`, `sala`, `lavanderia`, `quarto`,
  `banheiro`.
- `preco` → o valor em reais (ex: `129.90`). Se estiver `null`, o card mostra
  *"Ver preço no anúncio"* em vez de um número — útil quando você ainda não
  anotou o preço. Para preencher, troque `null` pelo valor.
- `unique: true` → só uma pessoa pode dar (aparece o botão "Já dei este
  presente" e, ao confirmar, o presente fica bloqueado).
- `unique: false` → pode ser dado por várias pessoas (roupas de cama,
  toalhas), sem botão de bloqueio.

Você pode ajustar qualquer um desses valores livremente conforme a sua
preferência. Para mover um item de aba, basta trocar a `categoria`.

## 7. Aba do Pix

Na lista de presentes existe a aba **"💙 Presente em Pix"**, que troca a grade
de produtos por um painel com a chave e um botão "Copiar chave".

Para alterar a chave, edite em `presentes.html`:

```html
<code class="pix-key" id="pix-key">35999275253</code>
<p class="pix-holder">Em nome de <strong>Wesley Batista Luz</strong></p>
```

Serve qualquer formato de chave (telefone, CPF, e-mail ou chave aleatória) —
todos foram testados e cabem no layout, inclusive no celular.

O botão de copiar usa a API moderna do navegador, que só funciona em
**HTTPS ou localhost**. Como Vercel, Netlify e GitHub Pages servem tudo em
HTTPS, funciona normalmente quando publicado. Se por algum motivo falhar, o
site seleciona a chave automaticamente para o convidado dar Ctrl+C.

## 8. Contato dos noivos e voltagem

- Os WhatsApps ficam na seção **"Falar com os Noivos"** (nas duas páginas) e
  também no rodapé, usando links `https://wa.me/NUMERO`. Para trocar, procure
  por `wa.me` em `index.html` e `presentes.html`.
- A lista de presentes tem um aviso destacado de que **todos os
  eletrodomésticos são 127V**. Está no bloco
  `<div class="info-banner info-banner--voltagem">` em `presentes.html`.
