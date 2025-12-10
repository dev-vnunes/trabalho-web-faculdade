/* js/script.js */

// --- 1. EVENTOS GLOBAIS (AO CARREGAR A PÁGINA) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Tenta recuperar o login (se a função existir/estiver logado)
    // Se você não estiver usando login agora, isso será ignorado sem erro
    if (typeof verificarLogin === "function") {
        verificarLogin(); 
    }

    // Carrega o número do carrinho salvo na memória (PARA A HOME FUNCIONAR)
    carregarContadorCarrinho();

    // Se estiver na página de Perfil, carrega os dados
    carregarDadosPerfil(); 
    
    // Se estiver na página do Carrinho, calcula os totais e salva na memória
    if (document.getElementById('lista-produtos')) {
        recalcularTudo();
        
        // Também ativa o filtro se estiver na página de Produtos
        filtrarPorCategoria();
    }
});

// --- 2. SISTEMA DE CARRINHO (LÓGICA + MEMÓRIA) ---

function atualizarCarrinho(input) {
    let quantidade = parseInt(input.value);
    let linha = input.closest('tr');

    // Validação de zero ou negativo
    if (quantidade <= 0) {
        let confirmar = confirm("Deseja remover este item do carrinho?");
        if (confirmar) {
            linha.remove();
            recalcularTudo(); // Recalcula após remover
            return;
        } else {
            input.value = 1;
            quantidade = 1;
        }
    }

    // Atualiza o preço total daquela linha (visual)
    let celulaPreco = linha.querySelector('.preco-unitario');
    let celulaTotalItem = linha.querySelector('.total-item');
    
    let precoUnitario = parseFloat(celulaPreco.getAttribute('data-preco'));
    let novoTotalItem = precoUnitario * quantidade;

    celulaTotalItem.innerText = formatarMoeda(novoTotalItem);

    // Atualiza o total geral
    recalcularTudo();
}

function recalcularTudo() {
    let totalGeral = 0;
    let totalItens = 0;
    
    // Pega todas as linhas visíveis na tabela
    let itens = document.querySelectorAll('.item-carrinho');

    itens.forEach(function(linha) {
        let inputQtd = linha.querySelector('.qtd-input');
        let celulaPreco = linha.querySelector('.preco-unitario');
        
        if (inputQtd && celulaPreco) {
            let qtd = parseInt(inputQtd.value);
            let preco = parseFloat(celulaPreco.getAttribute('data-preco'));
            
            totalGeral += (qtd * preco);
            totalItens += qtd; // Soma a quantidade de itens
        }
    });

    // 1. Atualiza o Total em Dinheiro na tela
    const elTotal = document.getElementById('total-final');
    if (elTotal) {
        elTotal.innerText = formatarMoeda(totalGeral);
    }

    // 2. SALVA NA MEMÓRIA (O Pulo do Gato)
    localStorage.setItem('qtdCarrinho', totalItens);

    // 3. Atualiza o texto do menu lá em cima
    atualizarVisualHeader(totalItens);
}

// Função chamada ao carregar qualquer página para ler a memória
function carregarContadorCarrinho() {
    let qtdSalva = localStorage.getItem('qtdCarrinho');
    if (qtdSalva) {
        atualizarVisualHeader(qtdSalva);
    }
}

// Função auxiliar que troca o texto "Carrinho (0)"
function atualizarVisualHeader(n) {
    const linkCarrinho = document.getElementById('qtd-carrinho');
    
    // Se achou pelo ID (novo html), atualiza
    if (linkCarrinho) {
        linkCarrinho.innerText = `🛒 Carrinho (${n})`;
    } else {
        // Fallback: Procura nos links se não achar o ID
        const links = document.querySelectorAll('.nav-icons a');
        links.forEach(link => {
            if (link.innerText.includes('Carrinho')) {
                link.innerText = `🛒 Carrinho (${n})`;
            }
        });
    }
}

// Função wrapper para compatibilidade
function verificarQtd(input) {
    atualizarCarrinho(input);
}


// --- 3. FORMULÁRIOS, MÁSCARAS E PERFIL ---

const cidadesPorEstado = {
    "SP": ["São Paulo", "Campinas", "Santos", "Ribeirão Preto"],
    "RJ": ["Rio de Janeiro", "Niterói", "Cabo Frio", "Petrópolis"],
    "MG": ["Belo Horizonte", "Ouro Preto", "Uberlândia", "Juiz de Fora"],
    "CE": ["Fortaleza", "Itapagé", "Sobral", "Juazeiro do Norte"] 
};

function carregarCidades() {
    const estadoSelect = document.getElementById('estado');
    const cidadeSelect = document.getElementById('cidade');
    
    if(!estadoSelect || !cidadeSelect) return;

    const estadoSelecionado = estadoSelect.value;
    cidadeSelect.innerHTML = '<option value="">Selecione a Cidade</option>';

    if (estadoSelecionado && cidadesPorEstado[estadoSelecionado]) {
        const cidades = cidadesPorEstado[estadoSelecionado];
        cidades.forEach(cidade => {
            let option = document.createElement('option');
            option.value = cidade;
            option.text = cidade;
            cidadeSelect.add(option);
        });
        cidadeSelect.disabled = false;
    } else {
        cidadeSelect.disabled = true;
    }
}

function mascaraCPF(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = valor;
}

function mascaraTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    input.value = valor;
}

function salvarUsuario(event, origem) {
    // Se quiser impedir o envio real do form, descomente a linha abaixo:
    // event.preventDefault(); 
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    
    if (!email.includes('@')) {
        mostrarNotificacao('Email inválido!', 'erro');
        if(event) event.preventDefault();
        return;
    }
    
    // Salva dados básicos
    localStorage.setItem('nomeUsuario', nome);
    
    // Verifica foto
    const inputFoto = document.getElementById('foto-upload');
    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('fotoPerfil', e.target.result);
        }
        reader.readAsDataURL(inputFoto.files[0]);
    }

    if (origem === 'cadastro') {
        localStorage.setItem('usuarioLogado', 'true');
        alert('Cadastro realizado! (Os dados foram para a URL via GET)');
    } else {
        mostrarNotificacao('Perfil atualizado!', 'sucesso');
    }
}

function carregarDadosPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    if (!formPerfil) return;

    document.getElementById('nome').value = localStorage.getItem('nomeUsuario') || '';
    document.getElementById('email').value = localStorage.getItem('emailUsuario') || '';
    document.getElementById('cpf').value = localStorage.getItem('cpfUsuario') || '';
    
    const fotoSalva = localStorage.getItem('fotoPerfil');
    if (fotoSalva) {
        document.getElementById('preview-img').src = fotoSalva;
    }
}

function previewImagem(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgPreview = document.getElementById('preview-img');
            if(imgPreview) imgPreview.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- 4. UTILITÁRIOS E FILTROS ---

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarNotificacao(msg, tipo) {
    const toast = document.getElementById("toast-box");
    if (toast) {
        toast.innerText = msg;
        toast.className = "show " + tipo;
        setTimeout(function(){ 
            toast.className = toast.className.replace("show", "").replace(tipo, ""); 
        }, 3000);
    } else {
        alert(msg);
    }
}

function filtrarPorCategoria() {
    const container = document.getElementById('lista-produtos');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoriaDesejada = urlParams.get('cat');

    if (!categoriaDesejada) return;

    const titulo = document.getElementById('titulo-categoria');
    if (titulo) {
        titulo.innerText = categoriaDesejada.charAt(0).toUpperCase() + categoriaDesejada.slice(1);
    }

    const cards = container.querySelectorAll('.card');
    cards.forEach(card => {
        const catCard = card.getAttribute('data-categoria');
        if (catCard === categoriaDesejada) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}