# UNIFACE — Portal Acadêmico (API + Front-end)

Este pacote separa o portal em duas partes:

- **`server.js`** — API REST (Node.js + Express) com todos os dados e regras de negócio que antes estavam embutidos no HTML (login, notas, frequência, financeiro, suporte, gestão de alunos pelo professor e as três telas da coordenação).
- **`uniface-portal-api.html`** — a mesma interface visual de antes, agora consumindo a API via `fetch` em vez de manipular um objeto local.

## Como rodar

1. Instale as dependências do back-end:
   ```
   npm install
   ```
2. Inicie o servidor:
   ```
   npm start
   ```
   A API sobe em `http://localhost:3000`.
3. Abra o arquivo `uniface-portal-api.html` diretamente no navegador (duplo clique, ou "Abrir arquivo").
   O front-end já está configurado para chamar `http://localhost:3000/api`.

> Se quiser servir o front-end por outra porta/domínio, basta ajustar a constante `API_BASE` no topo do `<script>` do HTML.

## Contas de teste (iguais ao arquivo original)

| Perfil | Matrícula | Senha |
|---|---|---|
| Aluno | 1000000001 | Aluno@123 |
| Professor | 2000000001 | Professor#26 |
| Coordenador | 3000000001 | Coord$2026 |

## Endpoints da API

Autenticação: `Authorization: Bearer <token>` (token retornado no login).

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/api/login` | — | Autentica e devolve o token |
| POST | `/api/logout` | qualquer | Invalida o token |
| GET | `/api/aluno/notas` | aluno | Notas das 4 disciplinas |
| GET | `/api/aluno/frequencia` | aluno | Faltas e % de frequência |
| GET | `/api/aluno/financeiro` | aluno | Boleto atual |
| POST | `/api/aluno/financeiro/pagar` | aluno | Marca o boleto como pago |
| GET | `/api/suporte` | aluno/professor | Mensagens enviadas por quem está logado |
| POST | `/api/suporte` | aluno/professor | Envia mensagem à coordenação |
| GET | `/api/professor/alunos` | professor | Roster de Cálculo I |
| PUT | `/api/professor/alunos/:matricula` | professor | Atualiza nota e/ou faltas |
| GET | `/api/coord/suporte` | coordenador | Todas as mensagens de suporte |
| POST | `/api/coord/suporte/:id/responder` | coordenador | Responde uma mensagem |
| GET/POST | `/api/coord/comunicados/professores` | coordenador | Lista/envia comunicado a professores |
| GET/POST | `/api/coord/comunicados/alunos` | coordenador | Lista/envia comunicado a alunos |
| GET | `/api/coord/professores` | coordenador | Lista de professores |
| POST | `/api/coord/professores/:matricula/demitir` | coordenador | Desliga um professor |
| GET | `/api/coord/alunos` | coordenador | Lista de alunos com situação |
| POST | `/api/coord/alunos/:matricula/acao` | coordenador | Advertir/suspender/expulsar (`status`) |
| GET | `/api/coord/historico` | coordenador | Histórico de ações administrativas |
| GET/POST | `/api/coord/diretoria` | coordenador | Lista/envia mensagem à diretoria |

Os dados continuam em memória (reiniciam ao reiniciar o servidor) — a mesma característica de demonstração do arquivo original, só que agora centralizada no back-end em vez do front-end.
