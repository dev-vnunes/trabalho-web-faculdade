document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();      // Checa se está logado para mudar o Header
    carregarDadosPerfil(); // Se estiver na página de perfil, carrega os dados
    
    // Se estiver na página do carrinho, calcula os totais iniciais
    if (document.getElementById('lista-produtos')) {
        recalcularTudo();
    }
});

// FORMULÁRIOS, MÁSCARAS E DADOS DO USUÁRIO

// Lista de Cidades para o Select Dinâmico
const cidadesPorEstado = {
    "SP": ["São Paulo", "Campinas", "Santos", "Ribeirão Preto"],
    "RJ": ["Rio de Janeiro", "Niterói", "Cabo Frio", "Petrópolis"],
    "MG": ["Belo Horizonte", "Ouro Preto", "Uberlândia", "Juiz de Fora"],
    "CE": ["Fortaleza", "Itapagé", "Sobral", "Juazeiro do Norte"] 
};

// Carrega as cidades baseado no Estado selecionado
function carregarCidades() {
    const estadoSelect = document.getElementById('estado');
    const cidadeSelect = document.getElementById('cidade');
    
    if(!estadoSelect || !cidadeSelect) return; // Proteção caso não esteja na página

    const estadoSelecionado = estadoSelect.value;

    // Limpa cidades anteriores
    cidadeSelect.innerHTML = '<option value="">Selecione a Cidade</option>';

    if (estadoSelecionado && cidadesPorEstado[estadoSelecionado]) {
        const cidades = cidadesPorEstado[estadoSelecionado];
        cidades.forEach(cidade => {
            let option = document.createElement('option');
            option.value = cidade;
            option.text = cidade;
            cidadeSelect.add(option);
        });
        cidadeSelect.disabled = false; // Habilita o campo
    } else {
        cidadeSelect.disabled = true; // Desabilita se não tiver estado
    }
}

// Máscara de CPF (XXX.XXX.XXX-XX)
function mascaraCPF(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove letras
    if (valor.length > 11) valor = valor.slice(0, 11); // Limita tamanho

    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    input.value = valor;
}

// Máscara de Telefone ((XX) XXXXX-XXXX)
function mascaraTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);

    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    
    input.value = valor;
}

// Preview da Imagem de Perfil ao selecionar arquivo
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

// Salva os dados (Cadastro ou Edição de Perfil)
function salvarUsuario(event, origem) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const cpf = document.getElementById('cpf').value;
    
    // Validação Básica de Email
    if (!email.includes('@') || !email.includes('.')) {
        mostrarNotificacao('Por favor, insira um email válido!', 'erro');
        return;
    }
    
    // Salva no LocalStorage
    localStorage.setItem('nomeUsuario', nome);
    localStorage.setItem('emailUsuario', email);
    localStorage.setItem('cpfUsuario', cpf);
    
    // Salva foto se houver nova
    const inputFoto = document.getElementById('foto-upload');
    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('fotoPerfil', e.target.result);
        }
        reader.readAsDataURL(inputFoto.files[0]);
    }

    if (origem === 'cadastro') {
        localStorage.setItem('usuarioLogado', 'true'); // Já loga automaticamente
        mostrarNotificacao('Cadastro realizado! Redirecionando...', 'sucesso');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    } else {
        mostrarNotificacao('Perfil atualizado com sucesso!', 'sucesso');
        // Atualiza a bolinha do header imediatamente
        verificarLogin(); 
    }
}

// Preenche o formulário da página Perfil com dados salvos
function carregarDadosPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    if (!formPerfil) return; // Só roda se estiver na página de perfil

    document.getElementById('nome').value = localStorage.getItem('nomeUsuario') || '';
    document.getElementById('email').value = localStorage.getItem('emailUsuario') || '';
    document.getElementById('cpf').value = localStorage.getItem('cpfUsuario') || '';
    
    const fotoSalva = localStorage.getItem('fotoPerfil');
    if (fotoSalva) {
        document.getElementById('preview-img').src = fotoSalva;
    }
}

// --- 4. LÓGICA DO CARRINHO DE COMPRAS ---

// Atualiza valores ao mudar a quantidade
function atualizarCarrinho(input) {
    let quantidade = parseInt(input.value);
    let linha = input.closest('tr'); // Pega a linha da tabela

    // Verifica exclusão
    if (quantidade <= 0) {
        let confirmar = confirm("Deseja remover este item do carrinho?");
        if (confirmar) {
            linha.remove();
            recalcularTudo();
            return;
        } else {
            input.value = 1;
            quantidade = 1;
        }
    }

    // Cálculos da linha
    let celulaPreco = linha.querySelector('.preco-unitario');
    let celulaTotalItem = linha.querySelector('.total-item');
    
    // Pega o valor "puro" do data-attribute
    let precoUnitario = parseFloat(celulaPreco.getAttribute('data-preco'));
    let novoTotalItem = precoUnitario * quantidade;

    // Atualiza visualmente
    celulaTotalItem.innerText = formatarMoeda(novoTotalItem);

    // Recalcula o total geral
    recalcularTudo();
}

// Soma todos os itens da tabela
function recalcularTudo() {
    let totalGeral = 0;
    let itens = document.querySelectorAll('.item-carrinho'); // Pega todas as linhas

    itens.forEach(function(linha) {
        let inputQtd = linha.querySelector('.qtd-input');
        let celulaPreco = linha.querySelector('.preco-unitario');
        
        if (inputQtd && celulaPreco) {
            let qtd = parseInt(inputQtd.value);
            let preco = parseFloat(celulaPreco.getAttribute('data-preco'));
            totalGeral += (qtd * preco);
        }
    });

    // Atualiza o H3 do Total Final se ele existir na página
    const elTotal = document.getElementById('total-final');
    if (elTotal) {
        elTotal.innerText = formatarMoeda(totalGeral);
    }
}

// Função wrapper para compatibilidade com o HTML antigo (se houver)
function verificarQtd(input) {
    atualizarCarrinho(input);
}

// --- 5. UTILITÁRIOS VISUAIS ---

// Formata número para Real (R$ 1.000,00)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Exibe mensagem de sucesso ou erro (Toast)
function mostrarNotificacao(msg, tipo) {
    const toast = document.getElementById("toast-box");
    
    if (toast) {
        toast.innerText = msg;
        toast.className = "show " + tipo; // Adiciona classes .show e .sucesso/.erro

        // Remove a mensagem após 3 segundos
        setTimeout(function(){ 
            toast.className = toast.className.replace("show", "").replace(tipo, ""); 
        }, 3000);
    } else {
        // Fallback caso não tenha a div toast
        alert(msg);
    }
}