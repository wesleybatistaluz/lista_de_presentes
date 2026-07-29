# Site de Casamento — Júlia & Wesley

Site estático (HTML/CSS/JS puro, sem build) com página inicial + lista de presentes.

## Estrutura

```
index.html          Página inicial (história, fotos, cerimônia, contagem regressiva)
presentes.html       Lista de presentes
css/style.css        Estilo (paleta azul serenity)
js/main.js            Menu mobile + contagem regressiva
js/presentes-data.js  Os 37 itens da lista (nome, preço, foto, link, categoria)
js/presentes.js       Renderiza os cards e controla "já foi dado"
js/supabase-config.js Chaves do banco (Supabase) — precisa preencher
assets/img/casal/      Fotos do casal (placeholders por enquanto)
assets/img/presentes/  Fotos dos produtos (já recortadas dos seus prints)
```

## 1. Trocar as fotos do casal

Em `assets/img/casal/` estão fotos de placeholder (gradiente azul). Troque cada
arquivo por uma foto real, mantendo o mesmo nome:

- `foto-historia.jpg` — foto usada na seção "Nossa História"
- `foto-01.jpg` até `foto-06.jpg` — galeria de fotos
- `hero-bg.jpg` — não é usada ainda, pode ignorar ou usar no futuro

## 2. Completar os links dos presentes

Abra `js/presentes-data.js`. Cada item tem um campo `link: ""`. Cole ali a URL
do anúncio no Mercado Livre (a mesma da sua lista de favoritos), por exemplo:

```js
{ id: "geladeira-electrolux", ..., link: "https://produto.mercadolivre.com.br/MLB-..." },
```

Enquanto o campo estiver vazio, o botão "Comprar" abre uma busca no Mercado
Livre pelo nome do produto (funciona, mas não é o anúncio exato que você
escolheu) — por isso vale a pena preencher todos.

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

## 4. Publicar

### Opção A — GitHub Pages (gratuito, mais simples)

1. Crie um repositório no GitHub e suba esta pasta:
   ```bash
   git init
   git add .
   git commit -m "site do casamento"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```
2. No GitHub: **Settings > Pages > Source: branch `main`, pasta `/ (root)`**.
3. O site fica em `https://SEU_USUARIO.github.io/SEU_REPO/`.

### Opção B — Vercel (gratuito, deploy por comando ou GitHub)

```bash
npm i -g vercel
vercel
```

Ou conecte o repositório do GitHub direto em https://vercel.com/new — como é
um site estático, não precisa configurar build command nem output directory.

Os dois funcionam igual, já que o banco (Supabase) é externo — pode escolher
o que for mais prático para você.

## 5. Categorias e "presente único" x "pode repetir"

Em `js/presentes-data.js`, cada item tem:

- `unique: true` → só uma pessoa pode dar (aparece o botão "Já dei este
  presente" e, ao confirmar, o presente fica bloqueado pra sempre).
- `unique: false` → pode ser dado por várias pessoas (roupas de cama,
  toalhas), sem botão de bloqueio.
- `destaque: true` → aparece também na aba "Presentes Especiais".

Você pode ajustar qualquer um desses valores livremente conforme a sua
preferência.
