document.getElementById('ano').textContent = new Date().getFullYear();

// ── Contador regressivo ──────────────────────────────────────────────────────
// Armazena o prazo no sessionStorage para que o tempo nao reinicie
// a cada clique do usuario enquanto ele estiver na mesma aba.
// sessionStorage e apagado quando o usuario fecha a aba/navegador.
(function iniciarContador() {
    var DURACAO_SEGUNDOS = 15 * 60; // 15 minutos de urgencia
    var CHAVE_STORAGE = 'oferta_expira_em';

    var agora = Math.floor(Date.now() / 1000);
    var expiraEm = Number(sessionStorage.getItem(CHAVE_STORAGE));

    // Se nao existe ou ja expirou, define novo prazo.
    if (!expiraEm || expiraEm <= agora) {
        expiraEm = agora + DURACAO_SEGUNDOS;
        sessionStorage.setItem(CHAVE_STORAGE, expiraEm);
    }

    var elH = document.getElementById('cnt-h');
    var elM = document.getElementById('cnt-m');
    var elS = document.getElementById('cnt-s');

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function atualizar() {
        var agora = Math.floor(Date.now() / 1000);
        var restante = Math.max(0, expiraEm - agora);

        var h = Math.floor(restante / 3600);
        var m = Math.floor((restante % 3600) / 60);
        var s = restante % 60;

        if (elH) elH.textContent = pad(h);
        if (elM) elM.textContent = pad(m);
        if (elS) elS.textContent = pad(s);

        // Quando chega a zero para de decrementar (nao reinicia).
        if (restante > 0) {
            setTimeout(atualizar, 1000);
        }
    }

    atualizar();
}());

// Configuracoes do carrossel: 3 visiveis, rotacao automatica e loop infinito.
var TOTAL_VISIVEIS = 3;
var INTERVALO_AUTOPLAY_MS = 5000;

var depoimentos = [];
var indiceInicial = 0;
var animando = false;
var autoplayId = null;

var grid = document.getElementById('depo-grid');
var dots = document.getElementById('depo-dots');
var botaoPrev = document.getElementById('depo-prev');
var botaoNext = document.getElementById('depo-next');

// Funcao utilitaria para criar elementos HTML de forma padronizada.
function criarElemento(tag, className, texto) {
    var el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (texto) {
        el.textContent = texto;
    }
    return el;
}

// Quantidade de paginas do carrossel (cada pagina representa 1 grupo de 3 cards).
function totalPaginas() {
    return Math.max(1, Math.ceil(depoimentos.length / TOTAL_VISIVEIS));
}

// Pagina atualmente exibida com base no indice inicial da janela.
function paginaAtual() {
    return Math.floor(indiceInicial / TOTAL_VISIVEIS) % totalPaginas();
}

// Monta o card via createElement para manter o codigo mais seguro que innerHTML concatenado.
function montarCard(review) {
    var card = criarElemento('div', 'depo-card');
    var stars = criarElemento('div', 'depo-stars', '★'.repeat(review.stars || 5));
    var texto = criarElemento('p', 'depo-texto', '"' + review.texto + '"');

    var autor = criarElemento('div', 'depo-autor');
    var avatar = criarElemento('div', 'depo-avatar', (review.nome || '?').charAt(0).toUpperCase());
    var info = criarElemento('div');
    var nome = criarElemento('strong', '', review.nome || 'Aluno(a)');
    var profissao = criarElemento('span', '', review.profissao || 'Aluno(a) do curso');

    info.appendChild(nome);
    info.appendChild(profissao);
    autor.appendChild(avatar);
    autor.appendChild(info);

    card.appendChild(stars);
    card.appendChild(texto);
    card.appendChild(autor);

    return card;
}

// Renderiza somente 3 por vez para funcionar como vitrine rotativa de prova social.
function renderizarJanela() {
    grid.innerHTML = '';

    if (!depoimentos.length) {
        return;
    }

    var totalParaMostrar = Math.min(TOTAL_VISIVEIS, depoimentos.length);

    for (var i = 0; i < totalParaMostrar; i += 1) {
        var idx = (indiceInicial + i) % depoimentos.length;
        grid.appendChild(montarCard(depoimentos[idx]));
    }

    atualizarDotsAtivo();
}

// Cria bolinhas de paginacao (1 bolinha por grupo de 3 depoimentos).
function renderizarDots() {
    if (!dots) {
        return;
    }

    dots.innerHTML = '';

    if (totalPaginas() <= 1) {
        return;
    }

    for (var i = 0; i < totalPaginas(); i += 1) {
        var dot = criarElemento('button', 'depo-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Ir para grupo ' + (i + 1));
        dot.dataset.pagina = i;

        dot.addEventListener('click', function (evt) {
            var paginaDestino = Number(evt.currentTarget.dataset.pagina);
            irParaPagina(paginaDestino);
        });

        dots.appendChild(dot);
    }

    atualizarDotsAtivo();
}

function atualizarDotsAtivo() {
    if (!dots) {
        return;
    }

    var ativos = dots.querySelectorAll('.depo-dot');
    var atual = paginaAtual();

    ativos.forEach(function (dot, idx) {
        dot.classList.toggle('is-active', idx === atual);
    });
}

// Permite clicar na bolinha e saltar para o grupo correspondente.
function irParaPagina(paginaDestino) {
    if (animando || depoimentos.length <= TOTAL_VISIVEIS) {
        return;
    }

    var atual = paginaAtual();
    if (paginaDestino === atual) {
        return;
    }

    var direcao = paginaDestino > atual ? 1 : -1;
    indiceInicial = (paginaDestino * TOTAL_VISIVEIS) % depoimentos.length;

    animando = true;
    grid.classList.add(direcao > 0 ? 'depo-grid--out-left' : 'depo-grid--out-right');

    setTimeout(function () {
        renderizarJanela();
        grid.classList.remove('depo-grid--out-left', 'depo-grid--out-right');
        grid.classList.add(direcao > 0 ? 'depo-grid--in-right' : 'depo-grid--in-left');

        setTimeout(function () {
            grid.classList.remove('depo-grid--in-right', 'depo-grid--in-left');
            animando = false;
        }, 260);
    }, 220);
}

// Troca com animacao suave e loop infinito usando aritmetica modular.
function avancar(delta) {
    if (animando || depoimentos.length <= TOTAL_VISIVEIS) {
        return;
    }

    animando = true;
    var classeSaida = delta > 0 ? 'depo-grid--out-left' : 'depo-grid--out-right';
    var classeEntrada = delta > 0 ? 'depo-grid--in-right' : 'depo-grid--in-left';

    grid.classList.add(classeSaida);

    setTimeout(function () {
        indiceInicial = (indiceInicial + delta + depoimentos.length) % depoimentos.length;
        renderizarJanela();

        grid.classList.remove('depo-grid--out-left', 'depo-grid--out-right');
        grid.classList.add(classeEntrada);

        setTimeout(function () {
            grid.classList.remove('depo-grid--in-right', 'depo-grid--in-left');
            animando = false;
        }, 260);
    }, 220);
}

// Inicia rotacao automatica para o carrossel ficar em movimento continuo.
function iniciarAutoplay() {
    if (depoimentos.length <= TOTAL_VISIVEIS) {
        return;
    }

    limparAutoplay();
    autoplayId = setInterval(function () {
        // Avanca em blocos de 3 para manter a ideia de "grupos" no carrossel.
        avancar(TOTAL_VISIVEIS);
    }, INTERVALO_AUTOPLAY_MS);
}

// Limpa o intervalo para evitar autoplay duplicado.
function limparAutoplay() {
    if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
    }
}

// Configura setas e pausa no hover para melhorar a leitura do usuario.
function configurarControles() {
    if (!botaoPrev || !botaoNext) {
        return;
    }

    botaoPrev.addEventListener('click', function () {
        avancar(-TOTAL_VISIVEIS);
    });

    botaoNext.addEventListener('click', function () {
        avancar(TOTAL_VISIVEIS);
    });

    var areaCarousel = document.querySelector('.depo-carousel');
    if (areaCarousel) {
        // Pausa no hover para facilitar leitura do depoimento.
        areaCarousel.addEventListener('mouseenter', limparAutoplay);
        areaCarousel.addEventListener('mouseleave', iniciarAutoplay);
    }
}

// Mensagem de fallback se o JSON falhar ou vier vazio.
function mostrarErroDepoimentos() {
    grid.innerHTML = '<p class="depo-erro">Nao foi possivel carregar os depoimentos agora.</p>';
}

// Carrega os depoimentos externos para deixar o HTML mais limpo e facil de manter.
fetch('reviews.json')
    .then(function (res) {
        if (!res.ok) {
            throw new Error('Falha ao carregar reviews.json');
        }
        return res.json();
    })
    .then(function (reviews) {
        depoimentos = Array.isArray(reviews) ? reviews : [];

        if (!depoimentos.length) {
            mostrarErroDepoimentos();
            return;
        }

        renderizarDots();
        renderizarJanela();
        configurarControles();
        iniciarAutoplay();
    })
    .catch(function () {
        mostrarErroDepoimentos();
    });