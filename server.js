/* ============================================================
   UNIFACE — API de back-end
   Reproduz, em endpoints REST, exatamente as mesmas regras e
   dados que antes viviam no <script> do portal (uniface-portal1.html).
   ============================================================ */
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

/* ============================================================
   BASE DE DADOS (em memória, apenas para fins de demonstração)
   — mesma estrutura e mesmos valores do arquivo original —
   ============================================================ */
const DB = {
  accounts: {
    '1000000001': { senha: 'Aluno@123',     role: 'aluno',       nome: 'Marina Duarte Costa' },
    '2000000001': { senha: 'Professor#26',  role: 'professor',   nome: 'Ricardo Andrade Lima' },
    '3000000001': { senha: 'Coord$2026',    role: 'coordenador', nome: 'Beatriz Salles Nogueira' }
  },

  students: {
    '1000000001': {
      nome: 'Marina Duarte Costa', curso: 'Engenharia de Software', status: 'ativo',
      materias: {
        calc1: { nome: 'Cálculo I',                nota: 8.5, faltas: 3, cargaHoraria: 60 },
        prog1: { nome: 'Introdução à Programação', nota: 9.2, faltas: 1, cargaHoraria: 60 },
        bd1:   { nome: 'Banco de Dados',            nota: 7.4, faltas: 5, cargaHoraria: 60 },
        eng1:  { nome: 'Engenharia de Software I',  nota: 8.0, faltas: 2, cargaHoraria: 60 }
      },
      boleto: { descricao: 'Mensalidade — Setembro/2026', valor: 1240.00, vencimento: '20/09/2026', status: 'pendente' }
    }
  },

  professorRoster: [
    { matricula: '1000000001', nome: 'Marina Duarte Costa' },
    { matricula: '1000000002', nome: 'João Pedro Alves Ferreira' },
    { matricula: '1000000003', nome: 'Camila Rocha Barbosa' },
    { matricula: '1000000004', nome: 'Lucas Henrique Martins' },
    { matricula: '1000000005', nome: 'Bianca Souza Ribeiro' },
    { matricula: '1000000006', nome: 'Rafael Nunes Carvalho' },
    { matricula: '1000000007', nome: 'Isabela Cristina Farias' },
    { matricula: '1000000008', nome: 'Gustavo Pereira Lins' },
    { matricula: '1000000009', nome: 'Ana Beatriz Moraes Diniz' },
    { matricula: '1000000010', nome: 'Thiago Vinícius Cunha' }
  ],
  calc1Grades: {
    '1000000002': { nota: 6.0, faltas: 8,  status: 'ativo' },
    '1000000003': { nota: 9.1, faltas: 0,  status: 'ativo' },
    '1000000004': { nota: 5.4, faltas: 12, status: 'ativo' },
    '1000000005': { nota: 8.8, faltas: 2,  status: 'ativo' },
    '1000000006': { nota: 4.9, faltas: 15, status: 'advertido' },
    '1000000007': { nota: 7.6, faltas: 4,  status: 'ativo' },
    '1000000008': { nota: 6.8, faltas: 6,  status: 'ativo' },
    '1000000009': { nota: 9.5, faltas: 1,  status: 'ativo' },
    '1000000010': { nota: 7.0, faltas: 9,  status: 'ativo' }
  },

  professors: [
    { matricula: '2000000001', nome: 'Ricardo Andrade Lima',    disciplina: 'Cálculo I',               status: 'ativo' },
    { matricula: '2000000002', nome: 'Fernanda Lopes Teixeira', disciplina: 'Banco de Dados',           status: 'ativo' },
    { matricula: '2000000003', nome: 'Carlos Eduardo Matos',    disciplina: 'Engenharia de Software I', status: 'ativo' }
  ],

  suporte: [],
  comProfessores: [],
  comAlunos: [],
  comDiretoria: [],
  acoesAdmin: []
};

const sessions = {};   // token -> { matricula, role, nome }
let msgCounter = 1;

/* ============================================================
   AUXILIARES
   ============================================================ */
function freqPercent(m) {
  const dadas = m.cargaHoraria - (m.faltas * 2); // 2h por falta, ilustrativo
  return Math.max(0, Math.round((dadas / m.cargaHoraria) * 100));
}

function getGradeRecord(matricula) {
  return matricula === '1000000001'
    ? DB.students['1000000001'].materias.calc1
    : DB.calc1Grades[matricula];
}

function hoje() {
  return new Date().toLocaleDateString('pt-BR');
}

function auth(requiredRoles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    const session = token && sessions[token];
    if (!session) return res.status(401).json({ erro: 'Não autenticado. Faça login novamente.' });
    if (requiredRoles && !requiredRoles.includes(session.role)) {
      return res.status(403).json({ erro: 'Acesso não permitido para este perfil.' });
    }
    req.session = session;
    next();
  };
}

/* ============================================================
   LOGIN / LOGOUT
   ============================================================ */
app.post('/api/login', (req, res) => {
  const { matricula, senha } = req.body || {};

  if (!/^\d{10}$/.test(matricula || '')) {
    return res.status(400).json({ erro: 'A matrícula deve conter exatamente 10 números.' });
  }
  const acc = DB.accounts[matricula];
  if (!acc || acc.senha !== senha) {
    return res.status(401).json({ erro: 'Matrícula ou senha inválida. Verifique os dados e tente novamente.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = { matricula, role: acc.role, nome: acc.nome };
  res.json({ token, matricula, role: acc.role, nome: acc.nome });
});

app.post('/api/logout', auth(), (req, res) => {
  const token = req.headers.authorization.slice(7);
  delete sessions[token];
  res.json({ ok: true });
});

/* ============================================================
   ALUNO
   ============================================================ */
app.get('/api/aluno/notas', auth(['aluno']), (req, res) => {
  res.json(DB.students[req.session.matricula].materias);
});

app.get('/api/aluno/frequencia', auth(['aluno']), (req, res) => {
  const materias = DB.students[req.session.matricula].materias;
  const out = {};
  for (const [chave, m] of Object.entries(materias)) {
    out[chave] = { ...m, percentual: freqPercent(m) };
  }
  res.json(out);
});

app.get('/api/aluno/financeiro', auth(['aluno']), (req, res) => {
  res.json(DB.students[req.session.matricula].boleto);
});

app.post('/api/aluno/financeiro/pagar', auth(['aluno']), (req, res) => {
  DB.students[req.session.matricula].boleto.status = 'pago';
  res.json(DB.students[req.session.matricula].boleto);
});

/* ============================================================
   SUPORTE — usado por aluno e professor
   ============================================================ */
app.get('/api/suporte', auth(['aluno', 'professor']), (req, res) => {
  res.json(DB.suporte.filter(m => m.matricula === req.session.matricula));
});

app.post('/api/suporte', auth(['aluno', 'professor']), (req, res) => {
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva uma mensagem antes de enviar.' });
  const msg = {
    id: msgCounter++,
    de: req.session.nome,
    role: req.session.role,
    matricula: req.session.matricula,
    texto,
    data: hoje(),
    resposta: null
  };
  DB.suporte.push(msg);
  res.status(201).json(msg);
});

/* ============================================================
   PROFESSOR — gerencia os 10 alunos de Cálculo I
   ============================================================ */
app.get('/api/professor/alunos', auth(['professor']), (req, res) => {
  const roster = DB.professorRoster.map(s => {
    const rec = getGradeRecord(s.matricula);
    return { matricula: s.matricula, nome: s.nome, nota: rec.nota, faltas: rec.faltas, status: rec.status || 'ativo' };
  });
  res.json(roster);
});

app.put('/api/professor/alunos/:matricula', auth(['professor']), (req, res) => {
  const rec = getGradeRecord(req.params.matricula);
  if (!rec) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  if (req.body.nota !== undefined) {
    rec.nota = Math.min(10, Math.max(0, parseFloat(req.body.nota) || 0));
  }
  if (req.body.faltas !== undefined) {
    rec.faltas = Math.max(0, parseInt(req.body.faltas, 10) || 0);
  }
  res.json({ matricula: req.params.matricula, nota: rec.nota, faltas: rec.faltas, status: rec.status || 'ativo' });
});

/* ============================================================
   COORDENAÇÃO — comunicação
   ============================================================ */
app.get('/api/coord/suporte', auth(['coordenador']), (req, res) => {
  res.json(DB.suporte);
});

app.post('/api/coord/suporte/:id/responder', auth(['coordenador']), (req, res) => {
  const msg = DB.suporte.find(m => m.id === Number(req.params.id));
  if (!msg) return res.status(404).json({ erro: 'Mensagem não encontrada.' });
  const resposta = (req.body.resposta || '').trim();
  if (!resposta) return res.status(400).json({ erro: 'Escreva uma resposta antes de enviar.' });
  msg.resposta = resposta;
  res.json(msg);
});

app.get('/api/coord/comunicados/professores', auth(['coordenador']), (req, res) => {
  res.json(DB.comProfessores);
});
app.post('/api/coord/comunicados/professores', auth(['coordenador']), (req, res) => {
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva um comunicado antes de enviar.' });
  const msg = { texto, data: hoje() };
  DB.comProfessores.unshift(msg);
  res.status(201).json(msg);
});

app.get('/api/coord/comunicados/alunos', auth(['coordenador']), (req, res) => {
  res.json(DB.comAlunos);
});
app.post('/api/coord/comunicados/alunos', auth(['coordenador']), (req, res) => {
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva um comunicado antes de enviar.' });
  const msg = { texto, data: hoje() };
  DB.comAlunos.unshift(msg);
  res.status(201).json(msg);
});

/* ============================================================
   COORDENAÇÃO — administração
   ============================================================ */
app.get('/api/coord/professores', auth(['coordenador']), (req, res) => {
  res.json(DB.professors);
});

app.post('/api/coord/professores/:matricula/demitir', auth(['coordenador']), (req, res) => {
  const p = DB.professors.find(x => x.matricula === req.params.matricula);
  if (!p) return res.status(404).json({ erro: 'Professor não encontrado.' });
  p.status = 'demitido';
  DB.acoesAdmin.push({ texto: `${p.nome} (${p.disciplina}) foi desligado(a) da instituição.`, data: hoje() });
  res.json(p);
});

app.get('/api/coord/alunos', auth(['coordenador']), (req, res) => {
  const alunos = [
    { matricula: '1000000001', nome: DB.students['1000000001'].nome, status: DB.students['1000000001'].status }
  ].concat(
    DB.professorRoster.slice(1).map(s => ({
      matricula: s.matricula,
      nome: s.nome,
      status: DB.calc1Grades[s.matricula].status
    }))
  );
  res.json(alunos);
});

app.post('/api/coord/alunos/:matricula/acao', auth(['coordenador']), (req, res) => {
  const { matricula } = req.params;
  const { status } = req.body;
  if (!['advertido', 'suspenso', 'expulso'].includes(status)) {
    return res.status(400).json({ erro: 'Ação inválida.' });
  }
  const rec = matricula === '1000000001' ? DB.students['1000000001'] : DB.calc1Grades[matricula];
  if (!rec) return res.status(404).json({ erro: 'Aluno não encontrado.' });

  const nome = matricula === '1000000001'
    ? DB.students['1000000001'].nome
    : DB.professorRoster.find(s => s.matricula === matricula).nome;

  const label = status === 'advertido' ? 'recebeu uma advertência'
              : status === 'suspenso'  ? 'foi suspenso(a)'
              : 'foi expulso(a) da instituição';

  rec.status = status;
  DB.acoesAdmin.push({ texto: `${nome} ${label}.`, data: hoje() });
  res.json({ matricula, status });
});

app.get('/api/coord/historico', auth(['coordenador']), (req, res) => {
  res.json(DB.acoesAdmin.slice().reverse());
});

/* ============================================================
   COORDENAÇÃO — diretoria
   ============================================================ */
app.get('/api/coord/diretoria', auth(['coordenador']), (req, res) => {
  res.json(DB.comDiretoria);
});
app.post('/api/coord/diretoria', auth(['coordenador']), (req, res) => {
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ erro: 'Escreva uma mensagem antes de enviar.' });
  const msg = { texto, data: hoje() };
  DB.comDiretoria.unshift(msg);
  res.status(201).json(msg);
});

/* ============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UNIFACE API rodando em http://localhost:${PORT}`));
