# Catálogo de Filmes · RocketLab 2026.2

Módulo de avaliação de filmes no estilo Letterboxd, voltado ao administrador do catálogo:
cadastrar, editar, remover e buscar filmes, e registrar avaliações com nota de 0 a 10.
Frontend em React + TypeScript (Vite) e backend em FastAPI com SQLite.

## Objetivo

Entregar a atividade DEV do RocketLab 2026.2: um sistema de avaliação de filmes sobre a base
fornecida (cerca de 95 mil filmes). O administrador mantém o catálogo e registra avaliações,
e o sistema mostra a média de cada filme.

## Funcionalidades

Pedidas no enunciado:

- cadastro de filme com título, diretor(es), ano de lançamento, gênero(s) e sinopse;
- catálogo paginado;
- busca de filmes por título;
- página de detalhes com as avaliações do filme;
- edição e remoção de filme (a remoção pede confirmação);
- criação de avaliação com nome, nota de 0 a 10 e resenha;
- média das avaliações no catálogo e no detalhe.

Complementares:

- filtro por gênero e ordenação por popularidade, título (A–Z), ano ou média;
- paginação com Primeira, Anterior, Próxima, Última e "Ir para a página";
- busca, gênero, ordenação e página guardados na URL (recarregar, Voltar/Avançar e compartilhar
  preservam o estado), com correção automática de páginas inválidas na URL;
- pôster opcional, com substituto quando o filme não tem imagem ou ela não carrega;
- estados de carregamento, erro (com "Tentar novamente") e vazio (com "Limpar filtros");
- avisos de sucesso depois de cadastrar, editar e remover;
- Storybook com os principais componentes de apresentação.

## Stack

| | |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2 assíncrono (aiosqlite), Alembic, SQLite, Pydantic v2 |
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS v4 |
| Qualidade | pytest e Ruff (backend); `tsc` e oxlint (frontend); Storybook 10 |

## Estrutura

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # composição das rotas sob /api/v1
│   │   ├── core/            # configurações (.env) e logging
│   │   ├── db/              # Base ORM, engine assíncrono e sessões
│   │   └── movies/          # modelos, schemas, regras (service), rotas e seed
│   ├── migrations/          # revisões do Alembic (0001 a 0004)
│   ├── tests/               # testes do backend (pytest)
│   ├── .env.example
│   └── pyproject.toml
├── frontend/
│   ├── .storybook/          # configuração do Storybook
│   ├── src/
│   │   ├── api/             # cliente HTTP e tipos da API
│   │   ├── components/      # componentes e suas stories (*.stories.tsx)
│   │   ├── hooks/           # consultas (TanStack Query) e filtros na URL
│   │   ├── pages/           # catálogo, detalhe, cadastro, edição e 404
│   │   └── utils/           # formatação e regras do formulário
│   ├── package.json
│   └── vite.config.ts       # proxy /api → backend
└── README.md
```

## Pré-requisitos

- **Python 3.11 ou superior** (validado com 3.14);
- **Node.js 22.22 ou superior**, com npm (exigência do React Router 8);
- **Git**;
- **os arquivos CSV da atividade**, que não fazem parte do repositório.

## Como executar

### 1. Clonar

```bash
git clone https://github.com/al1-yz/letterbox_rocketlab.git
cd letterbox_rocketlab
```

### 2. Backend

Rode todos os comandos do backend a partir da pasta `backend/`: o `.env` é lido dela, e o banco
SQLite é criado em `backend/rocketlab.db`.

```bash
cd backend
```

Crie e ative o ambiente virtual conforme o seu terminal:

| Terminal | Criar | Ativar |
|---|---|---|
| Linux / macOS | `python3 -m venv .venv` | `source .venv/bin/activate` |
| Git Bash (Windows) | `python -m venv .venv` | `source .venv/Scripts/activate` |
| PowerShell (Windows) | `python -m venv .venv` | `.venv\Scripts\Activate.ps1` |

> Se o PowerShell recusar o `Activate.ps1` por causa da política de execução de scripts, não é
> preciso ativar: chame os programas da `.venv` diretamente, por exemplo
> `.venv\Scripts\python -m pip install -e ".[dev]"`, `.venv\Scripts\alembic upgrade head` e
> `.venv\Scripts\uvicorn app.main:app --reload`.

Com a `.venv` ativa, instale as dependências (incluindo as de teste e lint), crie o `.env` e
aplique as migrations:

```bash
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
```

O `alembic upgrade head` cria todas as tabelas e índices (revisões 0001 a 0004).

#### Carga dos dados (seed)

Os CSVs não são versionados (`backend/data/` está no `.gitignore`). Extraia os pacotes de dados
da atividade dentro de `backend/data/`. Subpastas são aceitas: cada arquivo é localizado pelo
nome e deve aparecer uma única vez. O seed usa estes nove arquivos:

`dim_genres.csv`, `dim_companies.csv`, `dim_people.csv`, `dim_movies.csv`,
`bridge_movie_genre.csv`, `bridge_movie_company.csv`, `bridge_movie_person.csv`,
`fact_movies_performance.csv` e `movies_reviews.csv`.

O `dim_reviews.csv` também vem nos pacotes, mas é ignorado (ver
[Decisões técnicas](#decisões-técnicas)). Depois, ainda em `backend/`:

```bash
python -m app.movies.seed
```

Para ler os CSVs de outra pasta, use `python -m app.movies.seed --data-dir caminho/da/pasta`.

A carga leva de 1 a 2 minutos, roda numa única transação e termina com um relatório por
tabela. Com a base da atividade, o resultado esperado é:

| Tabela | Linhas |
|---|---:|
| `dim_genres` | 19 |
| `dim_companies` | 45.941 |
| `dim_people` | 424.656 |
| `dim_movies` | 95.645 |
| `bridge_movie_genre` | 121.521 |
| `bridge_movie_company` | 116.326 |
| `bridge_movie_person` | 745.450 |
| `fact_movies_performance` | 95.645 |
| `movie_reviews` | 43.666 |

Rodar o seed de novo não duplica nada: todas as linhas aparecem como "ignoradas". Para
recomeçar do zero, apague `backend/rocketlab.db` e rode de novo `alembic upgrade head` e o seed.

#### Iniciar a API

```bash
uvicorn app.main:app --reload
```

A API sobe em `http://127.0.0.1:8000`. Com `ENVIRONMENT=local` (valor do `.env.example`), o
SQLAlchemy imprime cada consulta SQL no terminal. Para um log mais limpo, use qualquer outro
valor nessa variável.

### 3. Frontend

Em outro terminal, a partir da raiz do repositório:

```bash
cd frontend
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`. O Vite repassa as
chamadas `/api` para `http://127.0.0.1:8000` (proxy em `vite.config.ts`), então a API precisa
estar rodando.

### Endereços

| | |
|---|---|
| Aplicação | http://localhost:5173 |
| API | http://127.0.0.1:8000/api/v1 |
| Documentação da API (Swagger) | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/health |
| Storybook | http://localhost:6006 (depois de `npm run storybook`) |

## Testes, lint e build

Backend, em `backend/` com a `.venv` ativa. Os testes usam um banco temporário e não dependem
do seed.

```bash
pytest
ruff check .
ruff format --check .
```

Frontend, em `frontend/`:

```bash
npm run build
npm run lint
npm run storybook
npm run build-storybook
```

| Script | O que faz |
|---|---|
| `npm run build` | checagem de tipos (`tsc -b`) e build de produção em `frontend/dist/` |
| `npm run lint` | oxlint |
| `npm run storybook` | Storybook em modo de desenvolvimento, na porta 6006 |
| `npm run build-storybook` | build estático do Storybook em `frontend/storybook-static/` |

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/v1/genres` | nomes dos gêneros |
| GET | `/api/v1/movies` | catálogo paginado: `q`, `genre`, `sort` (`popularity`, `title`, `recent`, `rating`), `page`, `page_size` (padrão 20, máximo 100) |
| POST | `/api/v1/movies` | cadastra um filme |
| GET | `/api/v1/movies/{id}` | detalhe com créditos, média e total de avaliações |
| PATCH | `/api/v1/movies/{id}` | atualiza só os campos enviados |
| DELETE | `/api/v1/movies/{id}` | remove o filme e suas avaliações |
| GET | `/api/v1/movies/{id}/reviews` | avaliações do filme, da mais recente para a mais antiga |
| POST | `/api/v1/movies/{id}/reviews` | cria uma avaliação |
| GET | `/health` | verificação de funcionamento |

Os contratos completos estão em `/docs`.

## Observações sobre os dados

- **Pôster:** 8.241 filmes importados não têm pôster; a interface mostra um substituto com o
  título.
- **Gênero e diretor:** 20.037 filmes importados não têm gênero e 16.181 não têm diretor. No
  cadastro, gênero e diretor são obrigatórios. Na edição, só são exigidos se o filme já os tinha,
  para que os filmes importados incompletos possam ter outros campos corrigidos.
- **Ano:** todos os filmes importados têm ano. O cadastro exige o ano, mas a coluna continua
  aceitando nulo por compatibilidade com a base.
- **Títulos:** a base grava os títulos em Title Case (por exemplo, "The Nun Ii"). Na exibição, a
  interface devolve numerais romanos claros para maiúsculas ("The Nun II") sem alterar o valor
  gravado.

## Decisões técnicas

- **Avaliações de 0 a 10:** a mesma escala na API, no banco (restrição `CHECK`) e na interface,
  que aceita passo de 0,1.
- **`movie_reviews` é a fonte de verdade:** a média e o total são calculados a partir das
  avaliações individuais. O `dim_reviews.csv` traz um resumo pronto que ficaria desatualizado a
  cada nova avaliação, por isso não é carregado.
- **Seed idempotente:** as linhas são inseridas pela chave primária e as já existentes são
  ignoradas. A carga inteira roda numa transação e confere as chaves estrangeiras no fim;
  qualquer outra violação desfaz tudo.
- **Backend:** FastAPI com SQLAlchemy assíncrono (aiosqlite) e SQLite. O schema é criado e
  evoluído só pelo Alembic. As chaves estrangeiras são ativadas em cada conexão, então remover um
  filme remove em cascata vínculos, métricas e avaliações.
- **PATCH parcial:** a edição envia só os campos alterados; salvar sem mudanças não gera
  requisição.
- **Ordenação por título:** letras primeiro, depois números, depois símbolos, sem diferenciar
  maiúsculas. A regra usa só funções nativas do SQLite e é sustentada por um índice de expressão
  (migration 0004), para as páginas finais não precisarem ordenar a tabela inteira. A ordenação
  padrão, por popularidade, também tem índice próprio (migration 0003).
- **Estado na URL:** busca, gênero, ordenação e página vivem na URL. Valores inválidos de página
  (0, negativos, texto, decimais ou acima da última) são corrigidos com `replace`, sem deixar a
  URL inválida no histórico.
- **TanStack Query:** cache das consultas, página anterior mantida na tela enquanto a próxima
  carrega, atualização do cache depois de cadastrar e editar, e remoção do filme apagado do cache.
- **Proxy do Vite:** o frontend chama `/api` no próprio servidor do Vite, que repassa para o
  FastAPI; não há URL do backend espalhada pelo código.
- **Storybook:** documenta `Poster`, `Rating`, `MovieCard`, `Pagination` e os estados de
  carregamento, erro e vazio (`States`), com os estilos reais da aplicação e um pôster fictício
  embutido, sem depender de internet.

## Decisões de escopo

- **CRUD:** o cadastro e a edição cobrem os campos pedidos no desafio (título, diretor, ano,
  gênero e sinopse).
- **Créditos somente leitura:** a base traz também Roteiro, Elenco e Produção. Esses dados
  aparecem na página de detalhes quando existem, mas são somente leitura nesta entrega: não há
  CRUD administrativo para esses relacionamentos. A estrutura do banco (pessoas, produtoras e
  tabelas de vínculo) permite essa expansão no futuro.
- **Pôster:** é um campo adicional suportado pela aplicação (cadastro, edição, catálogo e
  detalhe), não uma exigência do enunciado.
- **Melhorias de UX:** as transições discretas (que respeitam a preferência "reduzir movimento"
  do sistema) e a ação "Limpar filtros" são melhorias de experiência, não requisitos do desafio.

## Limitações conhecidas

- **Acentos na ordenação por título:** o SQLite sem a extensão ICU só converte maiúsculas e
  minúsculas em ASCII. Por isso, títulos com inicial acentuada ou de outros alfabetos aparecem
  depois do Z.
- **Páginas profundas:** páginas muito avançadas em "Melhor avaliados", ou com filtro de gênero,
  podem levar cerca de 1 segundo, porque a ordenação dessas combinações não tem índice próprio.