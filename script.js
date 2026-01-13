let guests = JSON.parse(localStorage.getItem('wedding_v6')) || [];
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

function addGuest() {
    const nameInput = document.getElementById('guestName');
    const name = nameInput.value;
    const cat = document.getElementById('guestCat').value;
    const age = document.getElementById('guestAge').value;
    if (!name) return;
    guests.push({ name, cat, age, status: 'Pendente' });
    nameInput.value = '';
    update();
}

function render() {
    const list = document.getElementById('guestList');
    const pending = document.getElementById('pendingList');
    const approved = document.getElementById('approvedList');
    list.innerHTML = ''; pending.innerHTML = ''; approved.innerHTML = '';

    let counts = { total: 0, sim: 0, adultos: 0, criancas: 0 };

    guests.forEach((g, i) => {
        counts.total++;
        const statusClass = g.status === 'Convidar' ? 'badge-success' : (g.status === 'Não Convidar' ? 'badge-danger' : 'badge-pending');

        list.innerHTML += `<tr>
                <td><span style="font-weight: 500">${g.name}</span></td>
                <td>${g.cat}</td>
                <td>${g.age}</td>
                <td><span class="badge ${statusClass}">${g.status}</span></td>
                <td style="text-align: right">
                    <button onclick="deleteGuest(${i})" style="color: var(--text-muted); border: none; background: transparent; cursor: pointer">
                        <i data-lucide="trash-2" style="width: 18px"></i>
                    </button>
                </td>
            </tr>`;

        if (g.status === 'Pendente') {
            pending.innerHTML += `
                <div class="validation-item">
                    <div>
                        <div style="font-weight: 600">${g.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted)">${g.cat} • ${g.age}</div>
                    </div>
                    <button class="btn-primary" onclick="startQuiz(${i})">Analisar</button>
                </div>`;
        }
        if (g.status === 'Convidar') {
            counts.sim++;
            if (g.age === 'Adulto') counts.adultos++; else counts.criancas++;
            approved.innerHTML += `<tr><td>${g.name}</td><td>${g.age}</td><td>${g.cat}</td></tr>`;
        }
    });

    document.getElementById('stat-total').innerText = counts.total;
    document.getElementById('stat-sim').innerText = counts.sim;
    document.getElementById('stat-adultos').innerText = counts.adultos;
    document.getElementById('stat-criancas').innerText = counts.criancas;
    lucide.createIcons();
}

function switchTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    event.currentTarget.classList.add('active');
}

// Lógica compartilhada
function update() { localStorage.setItem('wedding_v6', JSON.stringify(guests)); render(); }
function deleteGuest(i) { if (confirm('Remover convidado?')) { guests.splice(i, 1); update(); } }
function startQuiz(i) { currentIdx = i; step = 0; document.getElementById('quiz-overlay').style.display = 'grid'; showQuestion(); }
function showQuestion() {
    const g = guests[currentIdx];
    document.getElementById('q-header').innerText = g.cat + " • " + g.age;
    document.getElementById('q-name').innerText = g.name;
    document.getElementById('q-text').innerText = logic[g.cat][step].q;
}
function handleAnswer(ans) {
    const move = ans ? logic[guests[currentIdx].cat][step].s : logic[guests[currentIdx].cat][step].n;
    if (move === "S") finish("Convidar");
    else if (move === "N") finish("Não Convidar");
    else { step = move; showQuestion(); }
}
function finish(res) { document.getElementById('quiz-overlay').style.display = 'none'; guests[currentIdx].status = res; update(); }
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text("Lista Final de Convidados", 14, 20);
    doc.autoTable({ html: '#tabelaFinalPDF', startY: 30, headStyles: { fillColor: [99, 102, 241] } });
    doc.save("lista-casamento.pdf");
}

render();