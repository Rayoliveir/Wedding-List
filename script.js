let users = JSON.parse(localStorage.getItem('wedding_vault')) || {};
let currentUser = null;
let authMode = 'login';
let currentIdx = null;
let step = 0;

const logic = {
    "Amigo": [
        { q: "Teve contato nos últimos 12 meses?", s: 1, n: 2 },
        { q: "Convivem fora do trabalho/faculdade?", s: 3, n: "N" },
        { q: "Sabe do casamento ou conhece o seu par?", s: 4, n: "N" },
        { q: "Você o receberia na sua casa?", s: 4, n: "N" },
        { q: "A presença dele deixaria o dia mais especial?", s: "S", n: "N" }
    ],
    "Família": [
        { q: "Haveria conflito se não fosse convidado?", s: "S", n: 1 },
        { q: "Falaram-se no último ano?", s: 2, n: 3 },
        { q: "Seus pais fazem questão?", s: 3, n: "N" },
        { q: "A presença dele faria o dia mais especial?", s: "S", n: "N" }
    ]
};

// --- AUTH ---
function switchAuthMode(mode) {
    authMode = mode;
    document.getElementById('btn-login-tab').classList.toggle('active', mode === 'login');
    document.getElementById('btn-register-tab').classList.toggle('active', mode === 'register');
    document.getElementById('couple-input').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-main-btn').innerText = mode === 'login' ? 'Entrar' : 'Criar Conta';
    document.getElementById('auth-error').style.display = 'none';
}

function processAuth() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;
    const c = document.getElementById('couple-input').value.trim();
    const err = document.getElementById('auth-error');

    if (!u || !p) return;

    if (authMode === 'register') {
        if (users[u]) {
            err.innerText = "Usuário já existe";
            err.style.display = 'block';
            return;
        }
        users[u] = { password: p, couple: c || "Casal", guests: [] };
        localStorage.setItem('wedding_vault', JSON.stringify(users));
        alert("Conta criada! Faça login.");
        switchAuthMode('login');
    } else {
        if (users[u] && users[u].password === p) {
            currentUser = u;
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            document.getElementById('couple-title').innerText = users[u].couple;
            render();
        } else {
            err.innerText = "Usuário ou senha inválidos";
            err.style.display = 'block';
        }
    }
}

function logout() {
    currentUser = null;
    document.getElementById('auth-screen').style.display = 'grid';
    document.getElementById('main-app').style.display = 'none';
}

// --- CORE ---
function update() {
    users[currentUser].guests = users[currentUser].guests; // Mantém referência
    localStorage.setItem('wedding_vault', JSON.stringify(users));
    render();
}

function addGuest() {
    const nInput = document.getElementById('guestName');
    const name = nInput.value;
    if (!name) return;
    users[currentUser].guests.push({
        name,
        cat: document.getElementById('guestCat').value,
        age: document.getElementById('guestAge').value,
        status: 'Pendente'
    });
    nInput.value = '';
    update();
}

function render() {
    if (!currentUser) return;
    const list = document.getElementById('guestList');
    const pending = document.getElementById('pendingList');
    const approved = document.getElementById('approvedList');
    const gList = users[currentUser].guests;

    list.innerHTML = ''; pending.innerHTML = ''; approved.innerHTML = '';
    let counts = { total: 0, sim: 0, ad: 0, ki: 0 };

    gList.forEach((g, i) => {
        counts.total++;
        const sBadge = g.status === 'Convidar' ? 'badge-success' : (g.status === 'Não Convidar' ? 'badge-danger' : 'badge-pending');

        list.innerHTML += `<tr>
                <td><strong>${g.name}</strong></td>
                <td>${g.cat}</td>
                <td>${g.age}</td>
                <td><span class="badge ${sBadge}">${g.status}</span></td>
                <td style="text-align: right">
                    <button onclick="deleteGuest(${i})" style="border:none; background:none; cursor:pointer; color:var(--text-muted)"><i data-lucide="trash-2" style="width:16px"></i></button>
                </td>
            </tr>`;

        if (g.status === 'Pendente') {
            pending.innerHTML += `
                <div class="validation-item">
                    <div>
                        <div style="font-weight: 600">${g.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted)">${g.cat}</div>
                    </div>
                    <button class="btn-primary" onclick="startQuiz(${i})">Validar</button>
                </div>`;
        }
        if (g.status === 'Convidar') {
            counts.sim++;
            g.age === 'Adulto' ? counts.ad++ : counts.ki++;
            approved.innerHTML += `<tr><td>${g.name}</td><td>${g.age}</td><td>${g.cat}</td></tr>`;
        }
    });

    document.getElementById('stat-total').innerText = counts.total;
    document.getElementById('stat-sim').innerText = counts.sim;
    document.getElementById('stat-adultos').innerText = counts.ad;
    document.getElementById('stat-criancas').innerText = counts.ki;
    lucide.createIcons();
}

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    event.currentTarget.classList.add('active');
}

function startQuiz(i) { currentIdx = i; step = 0; document.getElementById('quiz-overlay').style.display = 'grid'; showQuestion(); }
function showQuestion() {
    const g = users[currentUser].guests[currentIdx];
    document.getElementById('q-header').innerText = g.cat;
    document.getElementById('q-name').innerText = g.name;
    document.getElementById('q-text').innerText = logic[g.cat][step].q;
}
function handleAnswer(ans) {
    const m = ans ? logic[users[currentUser].guests[currentIdx].cat][step].s : logic[users[currentUser].guests[currentIdx].cat][step].n;
    if (m === "S") finish("Convidar"); else if (m === "N") finish("Não Convidar"); else { step = m; showQuestion(); }
}
function finish(res) { document.getElementById('quiz-overlay').style.display = 'none'; users[currentUser].guests[currentIdx].status = res; update(); }
function deleteGuest(i) { if (confirm('Excluir?')) { users[currentUser].guests.splice(i, 1); update(); } }

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Lista de Convidados - " + users[currentUser].couple, 14, 20);
    doc.autoTable({ html: '#tabelaFinalPDF', startY: 30, headStyles: { fillColor: [99, 102, 241] } });
    doc.save("lista-casamento.pdf");
}

lucide.createIcons();
