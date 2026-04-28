// ====== STATE ======
let currentUser = null;

const USERS = {
  'admin@email.com': { password: 'admin', profile: 'GESTOR' },
  'operacional@email.com': { password: 'opec2026', profile: 'ATENDIMENTO' }
};

const ALL_MODULES = [
  { id: 'produtos',       name: 'Produtos',       icon: '📦', gestor: true,  atendimento: false },
  { id: 'servicos',       name: 'Serviços',        icon: '🩺', gestor: true,  atendimento: true  },
  { id: 'agendamentos',   name: 'Agendamentos',    icon: '📅', gestor: true,  atendimento: true  },
  { id: 'fornecedores',   name: 'Fornecedores',    icon: '🚚', gestor: true,  atendimento: false },
  { id: 'profissionais',  name: 'Profissionais',   icon: '👨‍⚕️', gestor: true,  atendimento: false },
  { id: 'clientes',       name: 'Clientes',        icon: '👥', gestor: true,  atendimento: true  },
];

// ====== MÁSCARAS COM IMASK ======
// Configurações de máscara para cada tipo de campo
const IMASK_CONFIGS = {
  cpf: {
    mask: '000.000.000-00'
  },
  cnpj: {
    mask: '00.000.000/0000-00'
  },
  telefone: {
    mask: [
      { mask: '(00) 0000-0000' },
      { mask: '(00) 00000-0000' }
    ]
  },
  cep: {
    mask: '00000-000'
  },
  money: {
    mask: 'R$ num',
    blocks: {
      num: {
        mask: Number,
        thousandsSeparator: '.',
        radix: ',',
        scale: 2,
        padFractionalZeros: true,
        normalizeZeros: true,
        signed: false
      }
    }
  }
};

// Armazena instâncias do IMask para poder destruí-las ao limpar o form
window._imaskInstances = [];

function applyMasks() {
  // Limpa instâncias anteriores
  window._imaskInstances.forEach(instance => instance.destroy());
  window._imaskInstances = [];

  document.querySelectorAll('input[data-mask]').forEach(input => {
    const maskType = input.dataset.mask;
    const config = IMASK_CONFIGS[maskType];
    if (config && typeof IMask !== 'undefined') {
      const mask = IMask(input, config);
      window._imaskInstances.push(mask);
    }
  });
}

// ====== ALERT ======
function showAlert(type, title, msg, cb) {
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  document.getElementById('alertIcon').textContent = icons[type] || '⚠️';
  document.getElementById('alertTitle').textContent = title;
  document.getElementById('alertMsg').textContent = msg;
  const box = document.getElementById('alertBox');
  box.className = 'alert-box type-' + type;
  document.getElementById('alertOverlay').classList.add('show');
  window._alertCb = cb || null;
}
function closeAlert() {
  document.getElementById('alertOverlay').classList.remove('show');
  if (window._alertCb) { window._alertCb(); window._alertCb = null; }
}

// ====== AUTH ======
function realizarLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const user = USERS[email];
  if (!user || user.password !== password) {
    document.getElementById('loginPassword').value = '';
    showAlert('error', 'Acesso Negado', 'E-mail ou Senha inválidos.');
    return;
  }

  currentUser = { login: email, profile: user.profile };
  localStorage.setItem('currentUser', JSON.stringify(currentUser));

  const mensagemBoasVindas = user.profile === 'GESTOR' ? 'Olá, Administrador!' : 'Olá, Atendente!';
  showAlert('info', 'Boas Vindas!', mensagemBoasVindas, () => {
    window.location.href = "main.html";
  });
}

function checkAuth() {
  currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = "index.html";
    return null;
  }
  return currentUser;
}

function doLogout() {
  localStorage.removeItem('currentUser');
  window.location.href = "index.html";
}

// ====== DASHBOARD (main.html) ======
function initDashboard() {
  const user = checkAuth();
  if (!user) return;

  const isGestor = user.profile === 'GESTOR';

  // Atualiza título de boas-vindas
  const welcomeTitle = document.getElementById('welcomeTitle');
  if (welcomeTitle) {
    welcomeTitle.textContent = isGestor ? 'Olá, Administrador!' : 'Olá, Atendente!';
  }

  // Atualiza badge de perfil
  const badge = document.getElementById('sectorBadge');
  if (badge) {
    badge.textContent = user.profile;
    badge.className = 'user-badge ' + (isGestor ? 'nivel-gestor' : 'nivel-atendimento');
  }

  // Aplica permissões nos cards
  const cards = document.querySelectorAll('.grid-modules .card');
  cards.forEach(card => {
    const link = card.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href');
    const moduleId = href.replace('.html', '');
    const moduleDef = ALL_MODULES.find(m => m.id === moduleId);
    if (!moduleDef) return;

    const allowed = isGestor ? moduleDef.gestor : moduleDef.atendimento;
    if (!allowed) {
      card.classList.add('locked');
      card.title = 'Acesso restrito ao perfil GESTOR';
      link.removeAttribute('href');
      link.style.cursor = 'not-allowed';
    }
  });
}

// ====== FORM PAGES ======
function initFormPage(moduleId) {
  const user = checkAuth();
  if (!user) return;

  const isGestor = user.profile === 'GESTOR';
  const moduleDef = ALL_MODULES.find(m => m.id === moduleId);

  if (!moduleDef) {
    showAlert('error', 'Erro', 'Módulo não encontrado.', () => {
      window.location.href = 'main.html';
    });
    return;
  }

  const allowed = isGestor ? moduleDef.gestor : moduleDef.atendimento;
  if (!allowed) {
    showAlert('error', 'Acesso Negado', 'Você não tem permissão para acessar este módulo.', () => {
      window.location.href = 'main.html';
    });
    return;
  }

  // Atualiza badge de perfil no header
  const badge = document.getElementById('sectorBadge');
  if (badge) {
    badge.textContent = user.profile;
    badge.className = 'user-badge ' + (isGestor ? 'nivel-gestor' : 'nivel-atendimento');
  }

  // Aplica máscaras com IMask (aguarda carregamento da lib)
  if (typeof IMask !== 'undefined') {
    applyMasks();
  } else {
    // Se IMask ainda não carregou, aguarda
    window.addEventListener('load', applyMasks);
  }
}

function submitForm(e) {
  e.preventDefault();
  showAlert('success', 'Cadastro Realizado!', 'Os dados foram salvos com sucesso.', () => {
    window.location.href = 'main.html';
  });
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    // Limpa inputs com máscaras (reseta o valor do IMask também)
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.value = '';
      // Dispara evento input para o IMask sincronizar
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

// ====== UTILS ======
function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// Initialize based on page
window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('main.html')) {
    initDashboard();
  }
});
