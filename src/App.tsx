import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Scale, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Info, 
  Coins, 
  PawPrint,
  Save,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Download,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  carregarDados,
  salvarDados,
  exportarBackup,
  validarEstrutura,
  migrarDados,
  Medicamento,
  StorageData,
  ProtocoloTipo
} from "./lib/storage";

export default function App() {
  // Estado para armazenar os medicamentos ativos (carrega do localStorage de forma robusta e migrada)
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>(() => {
    return carregarDados().produtos;
  });

  // Peso inserido pelo atendente
  const [pesoInput, setPesoInput] = useState<string>("");
  const [pesoCalculado, setPesoCalculado] = useState<number | null>(null);
  const [erroPeso, setErroPeso] = useState<string>(""); // Mensagem de erro para validação do peso do animal

  // Filtros de busca / recomendação de dosagem do fluxo rápido
  const [especiePet, setEspeciePet] = useState<"Cão" | "Gato">("Cão");
  const [tipoFiltro, setTipoFiltro] = useState<"Todos" | "Comprimido" | "Transdérmico">("Todos");
  const [faixaEtaria, setFaixaEtaria] = useState<"Adulto" | "Filhote">("Adulto");
  const [idadeDias, setIdadeDias] = useState<string>("");
  const [unidadeIdade, setUnidadeIdade] = useState<"Dias" | "Meses">("Dias");
  const [trataVermeCoracao, setTrataVermeCoracao] = useState<boolean>(false);
  const [trataGiardia, setTrataGiardia] = useState<boolean>(false);
  const [amploEspectro, setAmploEspectro] = useState<boolean>(false);

  // Estado para controle de exibição do gerenciador de medicamentos
  const [mostrarGerenciador, setMostrarGerenciador] = useState(false);

  // Estados para formulário de novos medicamentos
  const [novoNome, setNovoNome] = useState("");
  const [novoPeso, setNovoPeso] = useState("");
  const [novoPrecoCaixa, setNovoPrecoCaixa] = useState("");
  const [novaQtdComprimidosCaixa, setNovaQtdComprimidosCaixa] = useState("");
  const [novoEspecie, setNovoEspecie] = useState<"Cão" | "Gato" | "Ambos">("Cão");
  const [novoTipo, setNovoTipo] = useState<"Comprimido" | "Transdérmico">("Comprimido");
  const [novoIdadeMinimaDias, setNovoIdadeMinimaDias] = useState<string>("0");
  const [novoExclusivoFilhotes, setNovoExclusivoFilhotes] = useState<boolean>(false);
  const [novoTrataVermeCoracao, setNovoTrataVermeCoracao] = useState<boolean>(false);
  const [novoTrataGiardia, setNovoTrataGiardia] = useState<boolean>(false);
  const [novoAmploEspectro, setNovoAmploEspectro] = useState<boolean>(true);
  const [novoProtocolo, setNovoProtocolo] = useState<ProtocoloTipo>("duas_doses_15_dias");
  const [idEmEdicao, setIdEmEdicao] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState("");

  // Estados de feedback de backup
  const [erroBackup, setErroBackup] = useState("");
  const [sucessoBackup, setSucessoBackup] = useState("");

  // Referências de foco para melhor usabilidade
  const pesoInputRef = useRef<HTMLInputElement>(null);
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detecção automática do dia da semana (0: Domingo, 1: Segunda, ..., 3: Quarta, 4: Quinta, 5: Sexta, 6: Sábado)
  const diaSemana = useMemo(() => new Date().getDay(), []);
  const temDescontoAtivo = useMemo(() => diaSemana === 3 || diaSemana === 4 || diaSemana === 5, [diaSemana]);

  // Salva no localStorage sempre que alterar a lista utilizando a nova estrutura de JSON
  useEffect(() => {
    salvarDados({
      versao: 2,
      ultimaAtualizacao: new Date().toISOString(),
      produtos: medicamentos
    });
  }, [medicamentos]);

  // Função para formatar moeda em PT-BR
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Função para formatar números decimais em PT-BR (Quantidade de comprimidos: máximo duas casas decimais)
  const formatarNumero = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Regra de Negócio: Calcula comprimidos baseado no arredondamento para cima no múltiplo de 0,25 comprimido mais próximo. Mínimo 0,25.
  const calcularComprimidos = (peso: number, pesoTratado: number): number => {
    const exata = peso / pesoTratado;
    const arredondado = Math.ceil(exata * 4) / 4;
    return Math.max(0.25, arredondado);
  };

  // Evento para calcular o peso do animal com validações completas
  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault();
    setErroPeso("");

    const inputLimpo = pesoInput.trim();
    if (!inputLimpo) {
      setErroPeso("O peso do animal é obrigatório.");
      setPesoCalculado(null);
      return;
    }

    const pesoNum = parseFloat(inputLimpo.replace(",", "."));
    if (isNaN(pesoNum)) {
      setErroPeso("Insira um peso válido (somente números).");
      setPesoCalculado(null);
      return;
    }

    if (pesoNum === 0) {
      setErroPeso("O peso do animal não pode ser igual a zero.");
      setPesoCalculado(null);
      return;
    }

    if (pesoNum < 0) {
      setErroPeso("O peso do animal não pode ser negativo.");
      setPesoCalculado(null);
      return;
    }

    setPesoCalculado(pesoNum);
  };

  // Cálculo reativo em tempo real para reduzir os cliques do atendente durante a digitação do peso
  useEffect(() => {
    const inputLimpo = pesoInput.trim();
    if (!inputLimpo) {
      setPesoCalculado(null);
      setErroPeso("");
      return;
    }

    const pesoNum = parseFloat(inputLimpo.replace(",", "."));
    if (isNaN(pesoNum)) {
      setPesoCalculado(null);
      return;
    }

    if (pesoNum <= 0) {
      setPesoCalculado(null);
      return;
    }

    setErroPeso("");
    setPesoCalculado(pesoNum);
  }, [pesoInput]);

  // Limpar peso, todos os filtros, erros, resultados e devolver foco ao campo de peso
  const handleLimpar = () => {
    setPesoInput("");
    setPesoCalculado(null);
    setErroPeso("");
    setFaixaEtaria("Adulto");
    setIdadeDias("");
    setUnidadeIdade("Dias");
    setTrataVermeCoracao(false);
    setTrataGiardia(false);
    setAmploEspectro(false);
    setTipoFiltro("Todos");
    setTimeout(() => {
      pesoInputRef.current?.focus();
    }, 50);
  };

  // Adicionar ou editar medicamento com validações completas e tratamento de duplicidade
  const handleAdicionarMedicamento = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    const nomeTratado = novoNome.trim();
    if (!nomeTratado) {
      setErroForm("O nome do medicamento é obrigatório.");
      return;
    }

    // Validação de nomes duplicados (case insensitive, ignorando o próprio medicamento se estiver editando)
    const nomeDuplicado = medicamentos.some(
      (m) => m.nome.trim().toLowerCase() === nomeTratado.toLowerCase() && m.id !== idEmEdicao
    );
    if (nomeDuplicado) {
      setErroForm("Já existe um medicamento cadastrado com este nome.");
      return;
    }

    const pesoNum = parseFloat(novoPeso.trim().replace(",", "."));
    if (isNaN(pesoNum)) {
      setErroForm("O peso tratado deve ser um número válido.");
      return;
    }
    if (pesoNum <= 0) {
      setErroForm("O peso tratado deve ser maior que zero.");
      return;
    }

    const precoCaixaNum = parseFloat(novoPrecoCaixa.trim().replace(",", "."));
    if (isNaN(precoCaixaNum)) {
      setErroForm("O preço da caixa deve ser um número válido.");
      return;
    }
    if (precoCaixaNum < 0) {
      setErroForm("O preço da caixa não pode ser negativo.");
      return;
    }
    if (precoCaixaNum === 0) {
      setErroForm("O preço da caixa deve ser maior que zero.");
      return;
    }

    const qtdComprimidosNum = parseInt(novaQtdComprimidosCaixa.trim(), 10);
    if (isNaN(qtdComprimidosNum)) {
      setErroForm("A quantidade de comprimidos deve ser um número inteiro válido.");
      return;
    }
    if (qtdComprimidosNum <= 0) {
      setErroForm("A quantidade de comprimidos na caixa deve ser maior que zero.");
      return;
    }

    const precoPorComprimido = precoCaixaNum / qtdComprimidosNum;
    const idadeMinimaDiasNum = parseInt(novoIdadeMinimaDias.trim(), 10) || 0;

    if (idEmEdicao) {
      setMedicamentos((prev) =>
        prev.map((m) => {
          if (m.id === idEmEdicao) {
            return {
              ...m,
              nome: nomeTratado,
              pesoTratado: pesoNum,
              precoCaixa: precoCaixaNum,
              qtdComprimidosCaixa: qtdComprimidosNum,
              precoPorComprimido: precoPorComprimido,
              especie: novoEspecie,
              tipo: novoTipo,
              idadeMinimaDias: idadeMinimaDiasNum,
              exclusivoFilhotes: novoExclusivoFilhotes,
              trataVermeCoracao: novoTrataVermeCoracao,
              trataGiardia: novoTrataGiardia,
              amploEspectro: novoAmploEspectro,
              protocolo: novoProtocolo,
            };
          }
          return m;
        })
      );
      setIdEmEdicao(null);
    } else {
      const novoMed: Medicamento = {
        id: Date.now().toString(),
        nome: nomeTratado,
        categoria: "Vermífugo",
        pesoTratado: pesoNum,
        precoCaixa: precoCaixaNum,
        qtdComprimidosCaixa: qtdComprimidosNum,
        precoPorComprimido: precoPorComprimido,
        especie: novoEspecie,
        tipo: novoTipo,
        idadeMinimaDias: idadeMinimaDiasNum,
        exclusivoFilhotes: novoExclusivoFilhotes,
        trataVermeCoracao: novoTrataVermeCoracao,
        trataGiardia: novoTrataGiardia,
        amploEspectro: novoAmploEspectro,
        protocolo: novoProtocolo,
      };
      setMedicamentos((prev) => [...prev, novoMed]);
    }

    setNovoNome("");
    setNovoPeso("");
    setNovoPrecoCaixa("");
    setNovaQtdComprimidosCaixa("");
    setNovoEspecie("Cão");
    setNovoTipo("Comprimido");
    setNovoIdadeMinimaDias("0");
    setNovoExclusivoFilhotes(false);
    setNovoTrataVermeCoracao(false);
    setNovoTrataGiardia(false);
    setNovoAmploEspectro(true);
    setNovoProtocolo("duas_doses_15_dias");
    setErroForm("");

    // Mantém o foco no primeiro campo de cadastro de forma limpa
    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 50);
  };

  // Iniciar a edição de um medicamento
  const handleIniciarEdicao = (med: Medicamento) => {
    setIdEmEdicao(med.id);
    setNovoNome(med.nome);
    setNovoPeso(med.pesoTratado.toString());
    setNovoPrecoCaixa(med.precoCaixa.toString());
    setNovaQtdComprimidosCaixa(med.qtdComprimidosCaixa.toString());
    setNovoEspecie(med.especie);
    setNovoTipo(med.tipo);
    setNovoIdadeMinimaDias((med.idadeMinimaDias ?? 0).toString());
    setNovoExclusivoFilhotes(med.exclusivoFilhotes ?? false);
    setNovoTrataVermeCoracao(med.trataVermeCoracao ?? false);
    setNovoTrataGiardia(med.trataGiardia ?? false);
    setNovoAmploEspectro(med.amploEspectro ?? true);
    setNovoProtocolo(med.protocolo ?? "dose_unica");
    setErroForm("");

    // Rola suavemente até o formulário de cadastro/edição
    const formElement = document.getElementById("form-cadastro-secao");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }

    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 150);
  };

  // Cancelar a edição de um medicamento
  const handleCancelarEdicao = () => {
    setIdEmEdicao(null);
    setNovoNome("");
    setNovoPeso("");
    setNovoPrecoCaixa("");
    setNovaQtdComprimidosCaixa("");
    setNovoEspecie("Cão");
    setNovoTipo("Comprimido");
    setNovoIdadeMinimaDias("0");
    setNovoExclusivoFilhotes(false);
    setNovoTrataVermeCoracao(false);
    setNovoTrataGiardia(false);
    setNovoAmploEspectro(true);
    setNovoProtocolo("duas_doses_15_dias");
    setErroForm("");

    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 50);
  };

  // Excluir medicamento
  const handleExcluirMedicamento = (id: string) => {
    setMedicamentos((prev) => prev.filter((m) => m.id !== id));
  };

  // Restaurar medicamentos originais
  const handleRestaurarPadrao = () => {
    if (window.confirm("Deseja realmente restaurar a lista de medicamentos padrão? Suas alterações serão perdidas.")) {
      localStorage.removeItem("pet_shop_vermifugos"); // Apaga completamente os dados atuais
      const padrao = carregarDados(); // Recria utilizando a estrutura mais recente
      setMedicamentos(padrao.produtos); // Atualiza a tela automaticamente
      setSucessoBackup("Medicamentos restaurados para o padrão de fábrica!");
      setErroBackup("");
    }
  };

  // Exportar backup completo em formato JSON
  const handleExportarBackup = () => {
    setErroBackup("");
    setSucessoBackup("");
    try {
      exportarBackup(medicamentos);
      setSucessoBackup("Backup exportado com sucesso!");
    } catch (e) {
      setErroBackup("Falha ao exportar backup.");
    }
  };

  // Importar backup de arquivo JSON com validação estrita
  const handleImportarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroBackup("");
    setSucessoBackup("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Valida conteúdo, versão e estrutura
        if (validarEstrutura(parsed)) {
          // Substitui os dados atuais e atualiza a interface imediatamente
          const migrado = migrarDados(parsed);
          setMedicamentos(migrado.produtos);
          setSucessoBackup("Backup importado com sucesso! A interface foi atualizada.");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setErroBackup("Arquivo inválido. Certifique-se de que é um JSON com a estrutura e versão corretas.");
        }
      } catch (err) {
        setErroBackup("Erro ao processar o arquivo. Verifique se o formato do JSON está correto.");
      }
    };
    reader.readAsText(file);
  };

  // Regra de Negócio: Prepara os resultados calculados com memoização para desempenho.
  // Ordena pelo menor custo. Em caso de empate: 1º menor quantidade de comprimidos, 2º ordem alfabética.
  const resultados = useMemo(() => {
    if (pesoCalculado === null) return [];
    
    // Filtra medicamentos aplicáveis à espécie do pet, faixa etária, idade em dias e propriedades clínicas
    const filtrados = medicamentos.filter((med) => {
      // 1. Filtra por espécie: se o pet for Cão, aceita "Cão" ou "Ambos". Se for Gato, aceita "Gato" ou "Ambos".
      const matchEspecie = especiePet === "Cão"
        ? (med.especie === "Cão" || med.especie === "Ambos")
        : (med.especie === "Gato" || med.especie === "Ambos");
        
      // 2. Filtra por apresentação: se "Todos", aceita qualquer um. Caso contrário, compara exatamente.
      const matchTipo = tipoFiltro === "Todos" || med.tipo === tipoFiltro;

      // 3. Filtra por faixa etária e limite de idade
      let matchIdade = true;
      if (faixaEtaria === "Adulto") {
        // Se adulto: eliminar medicamentos exclusivos para filhotes
        if (med.exclusivoFilhotes) {
          matchIdade = false;
        }
      } else {
        // Se filhote: utilizar a idade mínima cadastrada dos medicamentos para filtrar os resultados
        const idadeDigitada = parseInt(idadeDias.trim(), 10);
        let idadeEmDias = isNaN(idadeDigitada) ? NaN : idadeDigitada;
        if (!isNaN(idadeEmDias) && unidadeIdade === "Meses") {
          idadeEmDias = idadeEmDias * 30;
        }
        if (!isNaN(idadeEmDias)) {
          // Mostrar apenas medicamentos compatíveis com animais daquela idade ou mais velha
          matchIdade = (med.idadeMinimaDias ?? 0) <= idadeEmDias;
        }
      }

      // 4. Filtra por características clínicas desejadas (filtros opcionais)
      const matchVermeCoracao = !trataVermeCoracao || !!med.trataVermeCoracao;
      const matchGiardia = !trataGiardia || !!med.trataGiardia;
      const matchAmploEspectro = !amploEspectro || !!med.amploEspectro;

      return matchEspecie && matchTipo && matchIdade && matchVermeCoracao && matchGiardia && matchAmploEspectro;
    });
    
    const res = filtrados.map((med) => {
      const quantidadeAdministracao = calcularComprimidos(pesoCalculado, med.pesoTratado);
      const multiplicador = med.protocolo === "duas_doses_15_dias" ? 2 : 1;
      const quantidadeTotal = quantidadeAdministracao * multiplicador;
      
      // Calcula a quantidade de caixas fechadas necessárias para cobrir a dose calculada total do protocolo
      const caixas = Math.ceil(quantidadeTotal / med.qtdComprimidosCaixa);
      const precoTotalOriginal = caixas * med.precoCaixa;
      const precoTotal = temDescontoAtivo ? precoTotalOriginal * 0.9 : precoTotalOriginal;
      return {
        ...med,
        quantidade: quantidadeAdministracao, // dose por administração
        quantidadeTotal, // quantidade total para o protocolo completo
        multiplicador,
        caixas,
        precoTotalOriginal,
        precoTotal,
      };
    });

    return res.sort((a, b) => {
      if (Math.abs(a.precoTotal - b.precoTotal) > 0.0001) {
        return a.precoTotal - b.precoTotal;
      }
      if (Math.abs(a.quantidadeTotal - b.quantidadeTotal) > 0.0001) {
        return a.quantidadeTotal - b.quantidadeTotal;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [
    pesoCalculado,
    medicamentos,
    temDescontoAtivo,
    especiePet,
    tipoFiltro,
    faixaEtaria,
    idadeDias,
    unidadeIdade,
    trataVermeCoracao,
    trataGiardia,
    amploEspectro
  ]);

  // Encontra o menor preço para destacar
  const menorPreco = useMemo(() => {
    return resultados.length > 0 ? resultados[0].precoTotal : 0;
  }, [resultados]);

  return (
    <div id="app-root" className="min-h-screen bg-[#f3f4f6] text-[#111827] font-sans antialiased flex flex-col">
      
      {/* Top Banner de Identificação */}
      <header id="app-header" className="bg-white border-b border-[#e5e7eb] py-4 px-6 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#4f46e5] text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#111827] flex items-center gap-2">
                PetCalcula <span className="font-normal text-[#6b7280] text-sm">| Interno</span>
              </h1>
              <p className="text-[10px] text-[#6b7280] font-semibold tracking-wider font-mono uppercase">Calculadora de Vermífugos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]">
              <span className="w-1.5 h-1.5 bg-[#4f46e5] rounded-full animate-pulse" />
              Unidade: Central • v2.1
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main id="app-main" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Grid de Operação */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Card Esquerdo - Entrada de Dados (5 colunas) */}
          <section id="input-section" className="lg:col-span-5 bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#4f46e5]" />
                Dados do Animal
              </h2>
              <p className="text-sm text-[#6b7280] mt-1">
                Insira o peso para gerar o comparativo instantâneo.
              </p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
              {/* 1. Espécie (Cão ou Gato) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  1. Espécie do Pet
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEspeciePet("Cão")}
                    className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      especiePet === "Cão"
                        ? "bg-[#4f46e5]/10 border-[#4f46e5] text-[#4f46e5] shadow-xs font-bold"
                        : "bg-white border-[#e5e7eb] text-[#374151] hover:bg-neutral-50/50"
                    }`}
                  >
                    <span className="text-base">🐕</span> Cão
                  </button>
                  <button
                    type="button"
                    onClick={() => setEspeciePet("Gato")}
                    className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      especiePet === "Gato"
                        ? "bg-[#4f46e5]/10 border-[#4f46e5] text-[#4f46e5] shadow-xs font-bold"
                        : "bg-white border-[#e5e7eb] text-[#374151] hover:bg-neutral-50/50"
                    }`}
                  >
                    <span className="text-base">🐈</span> Gato
                  </button>
                </div>
              </div>

              {/* 2. Peso Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="peso-animal" className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  2. Peso do Animal (kg)
                </label>
                <div className="relative">
                  <input
                    id="peso-animal"
                    ref={pesoInputRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 12.5"
                    value={pesoInput}
                    onChange={(e) => setPesoInput(e.target.value)}
                    aria-invalid={!!erroPeso}
                    aria-describedby={erroPeso ? "erro-peso-desc" : undefined}
                    className="w-full h-12 px-4 bg-white border-2 border-[#e5e7eb] rounded-lg font-medium text-lg text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] transition-all placeholder:text-neutral-400/40"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6b7280] font-mono">
                    kg
                  </span>
                </div>
                {erroPeso && (
                  <div id="erro-peso-desc" className="flex items-center gap-1.5 text-rose-600 text-xs bg-rose-50 p-2 rounded-md border border-rose-200 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{erroPeso}</span>
                  </div>
                )}
              </div>

              {/* 3. Faixa Etária */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  3. Faixa Etária
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFaixaEtaria("Adulto")}
                    className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      faixaEtaria === "Adulto"
                        ? "bg-[#4f46e5]/10 border-[#4f46e5] text-[#4f46e5] shadow-xs font-bold"
                        : "bg-white border-[#e5e7eb] text-[#374151] hover:bg-neutral-50/50"
                    }`}
                  >
                    <span>Adulto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaixaEtaria("Filhote")}
                    className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      faixaEtaria === "Filhote"
                        ? "bg-[#4f46e5]/10 border-[#4f46e5] text-[#4f46e5] shadow-xs font-bold"
                        : "bg-white border-[#e5e7eb] text-[#374151] hover:bg-neutral-50/50"
                    }`}
                  >
                    <span>Filhote</span>
                  </button>
                </div>
              </div>

              {/* 4. Idade do Filhote (Somente se Filhote) */}
              <AnimatePresence initial={false}>
                {faixaEtaria === "Filhote" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: -8 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                    exit={{ height: 0, opacity: 0, marginTop: -8 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-1.5"
                  >
                    <label htmlFor="idade-dias" className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                      4. Idade do Filhote ({unidadeIdade.toLowerCase()})
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="idade-dias"
                          type="text"
                          inputMode="numeric"
                          placeholder={unidadeIdade === "Dias" ? "Ex: 40" : "Ex: 3"}
                          value={idadeDias}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setIdadeDias(val);
                          }}
                          className="w-full h-11 px-4 bg-white border-2 border-[#e5e7eb] rounded-lg font-medium text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] transition-all placeholder:text-neutral-400/40"
                        />
                      </div>
                      <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-[#e5e7eb]">
                        <button
                          type="button"
                          onClick={() => setUnidadeIdade("Dias")}
                          className={`px-3 h-10 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                            unidadeIdade === "Dias"
                              ? "bg-white text-[#4f46e5] shadow-xs font-bold"
                              : "text-neutral-500 hover:text-neutral-800"
                          }`}
                        >
                          Dias
                        </button>
                        <button
                          type="button"
                          onClick={() => setUnidadeIdade("Meses")}
                          className={`px-3 h-10 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                            unidadeIdade === "Meses"
                              ? "bg-white text-[#4f46e5] shadow-xs font-bold"
                              : "text-neutral-500 hover:text-neutral-800"
                          }`}
                        >
                          Meses
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 5. Forma Farmacêutica (Tipo de Apresentação) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  5. Forma Farmacêutica
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#f3f4f6] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("Todos")}
                    className={`py-2 rounded-md font-medium text-xs text-center transition-all cursor-pointer border-none ${
                      tipoFiltro === "Todos"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6b7280] hover:text-[#111827]"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("Comprimido")}
                    className={`py-2 rounded-md font-medium text-xs text-center transition-all cursor-pointer border-none ${
                      tipoFiltro === "Comprimido"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6b7280] hover:text-[#111827]"
                    }`}
                  >
                    💊 Comprimido
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoFiltro("Transdérmico")}
                    className={`py-2 rounded-md font-medium text-xs text-center transition-all cursor-pointer border-none ${
                      tipoFiltro === "Transdérmico"
                        ? "bg-white text-[#111827] shadow-xs font-bold"
                        : "text-[#6b7280] hover:text-[#111827]"
                    }`}
                  >
                    💧 Transdérmico
                  </button>
                </div>
              </div>

              {/* 6. Características Desejadas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  6. Características Desejadas
                </label>
                <div className="flex flex-col gap-2.5 bg-neutral-50 p-3 rounded-lg border border-[#e5e7eb]">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                    <input
                      type="checkbox"
                      checked={trataVermeCoracao}
                      onChange={(e) => setTrataVermeCoracao(e.target.checked)}
                      className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                    />
                    <span>Trata verme do coração</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                    <input
                      type="checkbox"
                      checked={trataGiardia}
                      onChange={(e) => setTrataGiardia(e.target.checked)}
                      className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                    />
                    <span>Trata giárdia</span>
                  </label>
                </div>
              </div>

              {/* Botão de Limpar (Cálculo ocorre em tempo real, eliminando a necessidade de cliques extras para calcular) */}
              {(pesoInput || faixaEtaria !== "Adulto" || idadeDias || trataVermeCoracao || trataGiardia || tipoFiltro !== "Todos") && (
                <button
                  type="button"
                  onClick={handleLimpar}
                  className="w-full h-10 bg-neutral-100 hover:bg-neutral-200 text-[#6b7280] font-semibold rounded-lg transition-colors cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  title="Limpar formulário e redefinir filtros"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar Filtros e Peso
                </button>
              )}
            </form>
          </section>

          {/* Card Direito - Resultados e Comparação (7 colunas) */}
          <section id="results-section" className="lg:col-span-7 bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden flex flex-col min-h-[420px]">
            <div className="p-6 border-b border-[#e5e7eb] bg-white">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#4f46e5]" />
                Comparativo de Vermífugos
              </h2>
              {pesoCalculado !== null ? (
                <p className="text-sm text-[#6b7280] mt-1">
                  Exibindo custos ordenados do <strong className="text-[#4f46e5]">mais barato para o mais caro</strong> para um animal de <strong className="text-[#111827] font-mono">{formatarNumero(pesoCalculado)} kg</strong>.
                </p>
              ) : (
                <p className="text-sm text-[#6b7280] mt-1">
                  Digite o peso do animal e clique em <strong>Calcular</strong> para visualizar as dosagens e os custos ordenados.
                </p>
              )}
            </div>

            {/* Promoção de Quarta/Quinta/Sexta (10% de desconto) */}
            {temDescontoAtivo && (
              <div id="promocao-ativa-banner" className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-start gap-2.5 shadow-xs">
                <span className="text-sm">🟢</span>
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-900">Promoção ativa</div>
                  <div className="text-emerald-700 mt-0.5">Hoje todos os medicamentos possuem 10% de desconto.</div>
                </div>
              </div>
            )}

            {/* Estado Vazio ou Tabela de Resultados */}
            {pesoCalculado !== null ? (
              resultados.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50/30 min-h-[300px]">
                  <div className="bg-white text-neutral-400 p-4 rounded-full border border-neutral-200 shadow-3xs mb-3">
                    <Info className="w-6 h-6 text-neutral-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-800 text-sm">Nenhum vermífugo compatível encontrado</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                    Não existem medicamentos cadastrados para <strong>{especiePet}</strong> com apresentação do tipo <strong>{tipoFiltro === "Todos" ? "qualquer" : tipoFiltro}</strong>.
                  </p>
                  <p className="text-xs text-[#4f46e5] font-semibold mt-2">
                    Tente ajustar os filtros ou adicione o medicamento no gerenciador abaixo.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  
                  {/* Resumo da Pesquisa */}
                  <div className="mx-6 mb-4 p-4 bg-neutral-50 rounded-lg border border-[#e5e7eb] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                        Animal consultado
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111827]">
                        <span>{especiePet === "Cão" ? "🐕 Cão" : "🐈 Gato"}</span>
                        <span className="text-neutral-300">•</span>
                        <span>{formatarNumero(pesoCalculado)} kg</span>
                        <span className="text-neutral-300">•</span>
                        <span>
                          {faixaEtaria}{" "}
                          {faixaEtaria === "Filhote" && idadeDias
                            ? `(${idadeDias} ${
                                unidadeIdade === "Dias"
                                  ? idadeDias === "1"
                                    ? "dia"
                                    : "dias"
                                  : idadeDias === "1"
                                  ? "mês"
                                  : "meses"
                              })`
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 sm:items-end">
                      <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono sm:text-right">
                        Filtros aplicados
                      </div>
                      <div className="flex flex-wrap gap-2 mt-0.5 justify-start sm:justify-end">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-neutral-700 border border-[#e5e7eb] font-semibold text-[10px] shadow-3xs">
                          <span className="text-[#4f46e5] font-bold">✓</span> {tipoFiltro === "Todos" ? "Qualquer Apresentação" : tipoFiltro}
                        </span>
                        {trataVermeCoracao && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-neutral-700 border border-[#e5e7eb] font-semibold text-[10px] shadow-3xs">
                            <span className="text-[#4f46e5] font-bold">✓</span> Trata verme do coração
                          </span>
                        )}
                        {trataGiardia && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-neutral-700 border border-[#e5e7eb] font-semibold text-[10px] shadow-3xs">
                            <span className="text-[#4f46e5] font-bold">✓</span> Trata giárdia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabela de Resultados Dinâmica */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280] font-mono text-xs uppercase tracking-wider">
                          <th className="py-3.5 px-6 font-bold">Produto</th>
                          <th className="py-3.5 px-4 font-bold text-right">Dose Referência</th>
                          <th className="py-3.5 px-4 font-bold text-right">Dosagem Calculada</th>
                          <th className="py-3.5 px-6 font-bold text-right">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {resultados.map((item, index) => {
                          const isCheapest = item.precoTotal === menorPreco;
                          return (
                            <tr
                              key={item.id}
                              className={`transition-colors ${
                                isCheapest
                                  ? "bg-[#dcfce7]/75 text-[#166534] font-semibold"
                                  : "hover:bg-[#f9fafb]"
                              }`}
                            >
                              {/* Nome do Produto */}
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`font-semibold text-sm sm:text-base ${isCheapest ? "text-[#166534]" : "text-[#111827]"}`}>
                                      {item.nome}
                                    </span>
                                    {isCheapest && (
                                      <span className="inline-block py-0.5 px-1.5 text-[10px] font-bold bg-[#166534]/10 text-[#166534] rounded">
                                        MELHOR PREÇO
                                      </span>
                                    )}
                                  </div>

                                  <span className={`text-xs mt-0.5 block ${isCheapest ? "text-[#166534]/80" : "text-[#6b7280]"}`}>
                                    {item.pesoTratado} kg por {item.tipo === "Comprimido" ? "comprimido" : "unidade"} • Embalagem: {item.qtdComprimidosCaixa} {item.tipo === "Comprimido" ? "comp." : "unid."} ({formatarMoeda(item.precoCaixa)})
                                  </span>

                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
                                      item.protocolo === "duas_doses_15_dias"
                                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                                        : "bg-blue-100 text-blue-800 border border-blue-200"
                                    }`}>
                                      Protocolo: {item.protocolo === "duas_doses_15_dias" ? "2 doses (15 dias)" : "Dose única"}
                                    </span>
                                  </div>
                                </div>
                              </td>
  
                              {/* Dose de cobertura */}
                              <td className="py-4 px-4 text-right font-mono text-xs font-semibold">
                                {item.pesoTratado} kg / {item.tipo === "Comprimido" ? "comp." : "aplic."}
                              </td>
  
                              {/* Quantidade Calculada */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className={`text-[11px] font-semibold ${isCheapest ? "text-[#166534]/80" : "text-neutral-500"}`}>
                                    Dose p/ adm: <span className="font-mono font-bold">{formatarNumero(item.quantidade)}</span> {item.tipo === "Comprimido" ? "comp." : "unid."}
                                  </span>
                                  <span className="font-mono font-bold text-sm sm:text-base mt-0.5">
                                    Total: {formatarNumero(item.quantidadeTotal)} {item.tipo === "Comprimido" ? "comp." : "unid."}
                                  </span>
                                  <span className={`text-[10px] font-semibold ${isCheapest ? "text-[#166534]/80" : "text-[#6b7280]"}`}>
                                    {item.caixas} {item.caixas === 1 ? "caixa" : "caixas"}
                                  </span>
                                </div>
                              </td>
  
                              {/* Preço Total Calculado */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex flex-col items-end justify-center">
                                  {temDescontoAtivo ? (
                                    <div className="flex flex-col items-end gap-0.5">
                                      <div className="flex flex-col items-end leading-none mb-1">
                                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-mono font-bold">
                                          Valor Original
                                        </span>
                                        <span className="text-xs text-neutral-400 font-mono line-through">
                                          {formatarMoeda(item.precoTotalOriginal)}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-end leading-none">
                                        <span className="text-[9px] text-emerald-600 uppercase tracking-wider font-mono font-bold">
                                          Valor Com Desconto
                                        </span>
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                          {isCheapest && <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] flex-shrink-0" />}
                                          <span className="font-mono font-bold text-sm sm:text-base text-[#166534]">
                                            {formatarMoeda(item.precoTotal)}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                                        ({item.caixas} {item.caixas === 1 ? "cx" : "cxs"})
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end justify-center">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {isCheapest && <CheckCircle2 className="w-4 h-4 text-[#166534] flex-shrink-0" />}
                                        <span className="font-mono font-bold text-base">
                                          {formatarMoeda(item.precoTotal)}
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                                        ({item.caixas} {item.caixas === 1 ? "cx" : "cxs"})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
  
                </div>
              )
            ) : (
              /* Estado Vazio - Catálogo de Referência */
              <div className="flex-1 flex flex-col p-6 items-center justify-center text-center bg-neutral-50/50">
                <div className="max-w-md flex flex-col items-center gap-4 py-8">
                  <div className="bg-white text-[#6b7280] p-4 rounded-full border border-[#e5e7eb] shadow-2xs">
                    <Scale className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111827] text-sm uppercase tracking-wider font-mono">Aguardando Peso do Animal</h3>
                    <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                      Informe o peso do cão ou gato no painel à esquerda e clique no botão de calcular para exibir o comparativo ordenado por preço.
                    </p>
                  </div>
                </div>

                {/* Exibição rápida da tabela de referência atual */}
                <div className="w-full mt-4 bg-white border border-[#e5e7eb] rounded-lg overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 bg-[#f9fafb] border-b border-[#e5e7eb] text-left">
                    <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">Tabela de Consulta de Preço de Caixas</span>
                  </div>
                  <div className="divide-y divide-[#e5e7eb] text-left">
                    {medicamentos.map((m) => (
                      <div key={m.id} className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-neutral-50/50">
                        <div className="flex flex-col text-left gap-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[#111827]">{m.nome}</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold rounded ${
                              m.especie === "Cão"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : m.especie === "Gato"
                                ? "bg-pink-50 text-pink-700 border border-pink-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}>
                              {m.especie === "Cão" ? "🐕 Cão" : m.especie === "Gato" ? "🐈 Gato" : "🐾 Cão e Gato"}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold rounded ${
                              m.tipo === "Comprimido"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-teal-50 text-teal-700 border border-teal-200"
                            }`}>
                              {m.tipo === "Comprimido" ? "💊 Comp" : "💧 Transd"}
                            </span>
                            {m.trataVermeCoracao && (
                              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded">
                                Verme Coração
                              </span>
                            )}
                            {m.trataGiardia && (
                              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                Giárdia
                              </span>
                            )}
                            {m.amploEspectro && (
                              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded">
                                Amplo Espectro
                              </span>
                            )}
                            {m.exclusivoFilhotes ? (
                              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-purple-50 text-purple-600 border border-purple-100 rounded">
                                Só Filhote
                              </span>
                            ) : m.idadeMinimaDias && m.idadeMinimaDias > 0 ? (
                              <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-orange-50 text-orange-600 border border-orange-100 rounded">
                                Mín: {m.idadeMinimaDias}d
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-[#6b7280]">
                            Caixa: {formatarMoeda(m.precoCaixa)} ({m.qtdComprimidosCaixa} {m.tipo === "Comprimido" ? "comp." : "unid."} a {formatarMoeda(m.precoPorComprimido)}/cada)
                          </span>
                        </div>
                        <div className="flex justify-between sm:justify-end gap-4 text-[#6b7280] font-mono">
                          <span>{m.pesoTratado} kg / {m.tipo === "Comprimido" ? "comp." : "aplic."}</span>
                          <span className="text-[#111827] font-semibold">{formatarMoeda(m.precoCaixa)}/cx</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>

        {/* Accordion - Gerenciamento de Medicamentos */}
        <section id="management-section" className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setMostrarGerenciador(!mostrarGerenciador)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-neutral-50/50 transition-colors border-none text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">⚙️</span>
              <div>
                <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wider font-mono">Gerenciar Banco de Vermífugos</h2>
                <p className="text-xs text-[#6b7280]">Adicione, edite ou exclua os medicamentos disponíveis para cálculo</p>
              </div>
            </div>
            {mostrarGerenciador ? (
              <ChevronUp className="w-4 h-4 text-[#6b7280]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6b7280]" />
            )}
          </button>

          <AnimatePresence>
            {mostrarGerenciador && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[#e5e7eb] bg-neutral-50/30"
              >
                <div className="p-6 flex flex-col gap-6">
                  
                  {/* Formulário para Adicionar / Editar */}
                  <div 
                    id="form-cadastro-secao" 
                    className={`p-5 rounded-lg border-2 shadow-2xs flex flex-col gap-4 transition-all duration-300 ${
                      idEmEdicao 
                        ? "bg-purple-50/50 border-[#8b5cf6]" 
                        : "bg-white border-[#e5e7eb]"
                    }`}
                  >
                    <h3 className="font-semibold text-[#111827] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                      {idEmEdicao ? (
                        <>
                          <span className="text-[#8b5cf6]">✏️</span>
                          <span className="text-[#8b5cf6]">Editar Vermífugo</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#4f46e5]" />
                          <span>Cadastrar Novo Vermífugo</span>
                        </>
                      )}
                    </h3>

                    <form onSubmit={handleAdicionarMedicamento} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                      {/* Nome do Medicamento */}
                      <div className="md:col-span-6 flex flex-col gap-1">
                        <label htmlFor="form-nome" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Nome do Produto
                        </label>
                        <input
                          id="form-nome"
                          ref={nomeInputRef}
                          type="text"
                          placeholder="Ex: Chemital Gatos"
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          className="h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] placeholder:text-neutral-400/40"
                        />
                      </div>

                      {/* Espécie Indicada */}
                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label htmlFor="form-especie" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Espécie Indicada
                        </label>
                        <select
                          id="form-especie"
                          value={novoEspecie}
                          onChange={(e) => setNovoEspecie(e.target.value as "Cão" | "Gato" | "Ambos")}
                          className="h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] cursor-pointer"
                        >
                          <option value="Cão">🐕 Cão</option>
                          <option value="Gato">🐈 Gato</option>
                          <option value="Ambos">🐾 Ambos (Cão/Gato)</option>
                        </select>
                      </div>

                      {/* Tipo de Apresentação */}
                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label htmlFor="form-tipo" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Tipo de Apresentação
                        </label>
                        <select
                          id="form-tipo"
                          value={novoTipo}
                          onChange={(e) => setNovoTipo(e.target.value as "Comprimido" | "Transdérmico")}
                          className="h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] cursor-pointer"
                        >
                          <option value="Comprimido">💊 Comprimido</option>
                          <option value="Transdérmico">💧 Transdérmico</option>
                        </select>
                      </div>

                      {/* Peso Tratado por Dose */}
                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label htmlFor="form-peso" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Peso Tratado p/ Dose (kg)
                        </label>
                        <div className="relative">
                          <input
                            id="form-peso"
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 10"
                            value={novoPeso}
                            onChange={(e) => setNovoPeso(e.target.value)}
                            className="w-full h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] placeholder:text-neutral-400/40"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6b7280]">kg</span>
                        </div>
                      </div>

                      {/* Preço da Caixa */}
                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label htmlFor="form-preco-caixa" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Preço da Caixa (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6b7280]">R$</span>
                          <input
                            id="form-preco-caixa"
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 59.90"
                            value={novoPrecoCaixa}
                            onChange={(e) => setNovoPrecoCaixa(e.target.value)}
                            className="w-full h-10 pl-8 pr-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] placeholder:text-neutral-400/40"
                          />
                        </div>
                      </div>

                      {/* Quantidade na Caixa */}
                      <div className="md:col-span-3 flex flex-col gap-1">
                        <label htmlFor="form-qtd-comprimidos" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                          Qtd. de Doses na Caixa
                        </label>
                        <input
                          id="form-qtd-comprimidos"
                          type="text"
                          inputMode="numeric"
                          placeholder="Ex: 4"
                          value={novaQtdComprimidosCaixa}
                          onChange={(e) => setNovaQtdComprimidosCaixa(e.target.value)}
                          className="w-full h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] placeholder:text-neutral-400/40"
                        />
                      </div>

                      {/* Botão de Enviar / Ações de Edição */}
                      <div className="md:col-span-3">
                        {idEmEdicao ? (
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs sm:text-sm transition-colors cursor-pointer text-center focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              Salvar alterações
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelarEdicao}
                              className="flex-1 h-10 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-bold rounded-md text-xs sm:text-sm transition-colors cursor-pointer text-center focus:outline-hidden focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            className="w-full h-10 bg-[#4f46e5] hover:bg-[#4f46e5]/95 text-white font-semibold rounded-md text-sm transition-colors cursor-pointer text-center focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                          >
                            Adicionar Produto
                          </button>
                        )}
                      </div>

                      {/* Propriedades Adicionais de Idade e Eficácia Clínica */}
                      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-3.5 border-t border-[#e5e7eb] pt-3.5 mt-1">
                        {/* Idade Mínima (dias) */}
                        <div className="md:col-span-3 flex flex-col gap-1">
                          <label htmlFor="form-idade-minima" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                            Idade Mínima (dias)
                          </label>
                          <input
                            id="form-idade-minima"
                            type="text"
                            inputMode="numeric"
                            placeholder="Ex: 0"
                            value={novoIdadeMinimaDias}
                            onChange={(e) => setNovoIdadeMinimaDias(e.target.value.replace(/\D/g, ""))}
                            className="h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] placeholder:text-neutral-400/40"
                          />
                        </div>

                        {/* Protocolo de Tratamento */}
                        <div className="md:col-span-3 flex flex-col gap-1">
                          <label htmlFor="form-protocolo" className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                            Protocolo de Tratamento
                          </label>
                          <select
                            id="form-protocolo"
                            value={novoProtocolo}
                            onChange={(e) => setNovoProtocolo(e.target.value as ProtocoloTipo)}
                            className="h-10 px-3 bg-white border-2 border-[#e5e7eb] rounded-md text-sm text-[#111827] focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:border-[#4f46e5] cursor-pointer"
                          >
                            <option value="dose_unica">Dose única</option>
                            <option value="duas_doses_15_dias">2 doses (15 dias)</option>
                          </select>
                        </div>

                        {/* Checkbox Exclusivo para Filhotes */}
                        <div className="md:col-span-2 flex items-center h-10">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                            <input
                              type="checkbox"
                              checked={novoExclusivoFilhotes}
                              onChange={(e) => setNovoExclusivoFilhotes(e.target.checked)}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                            />
                            <span>Exclusivo p/ Filhotes</span>
                          </label>
                        </div>

                        {/* Checkboxes de propriedades clínicas */}
                        <div className="md:col-span-4 flex flex-wrap gap-x-4 gap-y-2 items-center h-10">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                            <input
                              type="checkbox"
                              checked={novoTrataVermeCoracao}
                              onChange={(e) => setNovoTrataVermeCoracao(e.target.checked)}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                            />
                            <span>Verme do Coração</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                            <input
                              type="checkbox"
                              checked={novoTrataGiardia}
                              onChange={(e) => setNovoTrataGiardia(e.target.checked)}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                            />
                            <span>Giárdia</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#374151] select-none">
                            <input
                              type="checkbox"
                              checked={novoAmploEspectro}
                              onChange={(e) => setNovoAmploEspectro(e.target.checked)}
                              className="w-4 h-4 rounded border-[#d1d5db] text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                            />
                            <span>Amplo Espectro</span>
                          </label>
                        </div>
                      </div>
                    </form>

                    {erroForm && (
                      <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-md border border-rose-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{erroForm}</span>
                      </div>
                    )}
                  </div>

                  {/* Seção de Backup e Sincronização */}
                  <div id="backup-section" className="bg-neutral-50 p-4 rounded-lg border border-[#e5e7eb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#111827] uppercase tracking-wider font-mono">Backup e Sincronização</span>
                      <span className="text-[11px] text-[#6b7280]">Salve ou recupere a base completa de vermífugos em arquivos JSON.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Botão Exportar */}
                      <button
                        type="button"
                        onClick={handleExportarBackup}
                        className="flex-1 sm:flex-initial h-9 px-3.5 bg-white border border-[#e5e7eb] hover:bg-neutral-50 hover:text-[#4f46e5] text-xs font-semibold text-[#374151] rounded-md transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Exportar Backup
                      </button>
                      
                      {/* Botão Importar */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-initial h-9 px-3.5 bg-[#4f46e5] hover:bg-[#4f46e5]/90 text-xs font-semibold text-white rounded-md transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Importar Backup
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportarBackup}
                        accept=".json"
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Mensagens de Feedback de Backup */}
                  {erroBackup && (
                    <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2.5 rounded-md border border-rose-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{erroBackup}</span>
                    </div>
                  )}
                  {sucessoBackup && (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 p-2.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{sucessoBackup}</span>
                    </div>
                  )}

                  {/* Lista de Medicamentos Cadastrados */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[#111827] text-xs uppercase tracking-wider font-mono">
                        Produtos Ativos ({medicamentos.length})
                      </h3>
                    </div>

                    <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-neutral-50 border-b border-[#e5e7eb] text-[#6b7280] font-mono text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 px-4 font-bold">Nome do Produto</th>
                            <th className="py-2.5 px-4 font-bold">Indicado Para</th>
                            <th className="py-2.5 px-4 font-bold">Apresentação</th>
                            <th className="py-2.5 px-4 text-right font-bold">Peso Tratado</th>
                            <th className="py-2.5 px-4 text-right font-bold">Valor p/ Dose</th>
                            <th className="py-2.5 px-4 text-right font-bold">Qtd. na Caixa</th>
                            <th className="py-2.5 px-4 text-right font-bold">Valor da Caixa</th>
                            <th className="py-2.5 px-4 text-center font-bold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e7eb]">
                          {medicamentos.map((m) => (
                            <tr key={m.id} className="hover:bg-neutral-50/50">
                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-1 text-left">
                                  <span className="font-semibold text-[#111827]">{m.nome}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {m.trataVermeCoracao && (
                                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded">
                                        Verme do Coração
                                      </span>
                                    )}
                                    {m.trataGiardia && (
                                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                        Giárdia
                                      </span>
                                    )}
                                    {m.amploEspectro && (
                                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded">
                                        Amplo Espectro
                                      </span>
                                    )}
                                    {m.exclusivoFilhotes ? (
                                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-purple-50 text-purple-600 border border-purple-100 rounded">
                                        Apenas Filhotes
                                      </span>
                                    ) : m.idadeMinimaDias && m.idadeMinimaDias > 0 ? (
                                      <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-orange-50 text-orange-600 border border-orange-100 rounded">
                                        Mín: {m.idadeMinimaDias} dias
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                  m.especie === "Cão"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : m.especie === "Gato"
                                    ? "bg-pink-50 text-pink-700 border border-pink-200"
                                    : "bg-purple-50 text-purple-700 border border-purple-200"
                                }`}>
                                  {m.especie === "Cão" ? "🐕 Cão" : m.especie === "Gato" ? "🐈 Gato" : "🐾 Cão e Gato"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                  m.tipo === "Comprimido"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-teal-50 text-teal-700 border border-teal-200"
                                }`}>
                                  {m.tipo === "Comprimido" ? "💊 Comprimido" : "💧 Transdérmico"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-[#6b7280]">
                                {m.pesoTratado} kg / {m.tipo === "Comprimido" ? "comp." : "aplic."}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-[#6b7280]">{formatarMoeda(m.precoPorComprimido)}</td>
                              <td className="py-3 px-4 text-right font-mono text-[#6b7280]">
                                {m.qtdComprimidosCaixa} {m.tipo === "Comprimido" ? "comp." : "unid."}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-[#111827] font-semibold">{formatarMoeda(m.precoCaixa)}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleIniciarEdicao(m)}
                                    className="text-[#4f46e5] hover:text-[#4338ca] p-1.5 rounded-md hover:bg-[#e0e7ff] transition-colors cursor-pointer flex items-center gap-0.5 text-xs font-semibold"
                                    title="Editar Vermífugo"
                                  >
                                    <span>✏️</span>
                                    <span className="hidden sm:inline">Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExcluirMedicamento(m.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Excluir Vermífugo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Footer / Nota Rodapé */}
      <footer id="app-footer" className="bg-white border-t border-[#e5e7eb] py-4 px-6 text-center text-xs text-[#6b7280] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} - Sistema de Atendimento Veterinário (Módulo Vermífugos)
          </div>
          <div>
            Priorize sempre a indicação e a bula do fabricante de cada vermífugo.
          </div>
        </div>
      </footer>
      
    </div>
  );
}
