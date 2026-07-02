import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Scale, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Info, 
  Coins, 
  Sparkles, 
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
  StorageData
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

  // Filtros de busca / recomendação de dosagem
  const [especiePet, setEspeciePet] = useState<"Cão" | "Gato">("Cão");
  const [tipoFiltro, setTipoFiltro] = useState<"Todos" | "Comprimido" | "Transdérmico">("Todos");

  // Estado para controle de exibição do gerenciador de medicamentos
  const [mostrarGerenciador, setMostrarGerenciador] = useState(false);

  // Estados para formulário de novos medicamentos
  const [novoNome, setNovoNome] = useState("");
  const [novoPeso, setNovoPeso] = useState("");
  const [novoPrecoCaixa, setNovoPrecoCaixa] = useState("");
  const [novaQtdComprimidosCaixa, setNovaQtdComprimidosCaixa] = useState("");
  const [novoEspecie, setNovoEspecie] = useState<"Cão" | "Gato" | "Ambos">("Cão");
  const [novoTipo, setNovoTipo] = useState<"Comprimido" | "Transdérmico">("Comprimido");
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

  // Limpar peso, erros, resultados e devolver foco ao campo de peso
  const handleLimpar = () => {
    setPesoInput("");
    setPesoCalculado(null);
    setErroPeso("");
    setTimeout(() => {
      pesoInputRef.current?.focus();
    }, 50);
  };

  // Adicionar novo medicamento com validações completas e tratamento de duplicidade
  const handleAdicionarMedicamento = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    const nomeTratado = novoNome.trim();
    if (!nomeTratado) {
      setErroForm("O nome do medicamento é obrigatório.");
      return;
    }

    // Validação de nomes duplicados (case insensitive)
    const nomeDuplicado = medicamentos.some(
      (m) => m.nome.trim().toLowerCase() === nomeTratado.toLowerCase()
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
    };

    setMedicamentos((prev) => [...prev, novoMed]);
    setNovoNome("");
    setNovoPeso("");
    setNovoPrecoCaixa("");
    setNovaQtdComprimidosCaixa("");
    setNovoEspecie("Cão");
    setNovoTipo("Comprimido");
    setErroForm("");

    // Mantém o foco no primeiro campo de cadastro de forma limpa
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
    
    // Filtra medicamentos aplicáveis à espécie do pet e ao tipo de apresentação
    const filtrados = medicamentos.filter((med) => {
      // Filtra por espécie: se o pet for Cão, aceita "Cão" ou "Ambos". Se for Gato, aceita "Gato" ou "Ambos".
      const matchEspecie = especiePet === "Cão"
        ? (med.especie === "Cão" || med.especie === "Ambos")
        : (med.especie === "Gato" || med.especie === "Ambos");
        
      // Filtra por apresentação: se "Todos", aceita qualquer um. Caso contrário, compara exatamente.
      const matchTipo = tipoFiltro === "Todos" || med.tipo === tipoFiltro;

      return matchEspecie && matchTipo;
    });
    
    const res = filtrados.map((med) => {
      const quantidade = calcularComprimidos(pesoCalculado, med.pesoTratado);
      // Calcula a quantidade de caixas fechadas necessárias para cobrir a dose calculada
      const caixas = Math.ceil(quantidade / med.qtdComprimidosCaixa);
      const precoTotalOriginal = caixas * med.precoCaixa;
      const precoTotal = temDescontoAtivo ? precoTotalOriginal * 0.9 : precoTotalOriginal;
      return {
        ...med,
        quantidade,
        caixas,
        precoTotalOriginal,
        precoTotal,
      };
    });

    return res.sort((a, b) => {
      if (Math.abs(a.precoTotal - b.precoTotal) > 0.0001) {
        return a.precoTotal - b.precoTotal;
      }
      if (Math.abs(a.quantidade - b.quantidade) > 0.0001) {
        return a.quantidade - b.quantidade;
      }
      return a.nome.localeCompare(b.nome);
    });
  }, [pesoCalculado, medicamentos, temDescontoAtivo, especiePet, tipoFiltro]);

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

            <form onSubmit={handleCalcular} className="flex flex-col gap-5">
              {/* Seleção de Espécie (Cão ou Gato) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  Espécie do Pet
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

              {/* Filtro de Formato (Comprimido ou Transdérmico) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  Tipo de Apresentação
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
                    Comprimido
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
                    Transdérmico
                  </button>
                </div>
              </div>

              {/* Peso Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="peso-animal" className="text-xs font-bold text-[#6b7280] uppercase tracking-wider font-mono">
                  Peso do Animal (kg)
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

              {/* Botões de Ação */}
              <div className="flex gap-2.5 mt-2">
                <button
                  type="submit"
                  className="flex-1 h-12 bg-[#4f46e5] hover:bg-[#4f46e5]/95 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer text-center text-sm flex items-center justify-center gap-2"
                >
                  Calcular Orçamento
                </button>
                {(pesoInput || pesoCalculado !== null) && (
                  <button
                    type="button"
                    onClick={handleLimpar}
                    className="px-4 h-12 bg-neutral-100 hover:bg-neutral-200 text-[#6b7280] font-medium rounded-lg transition-colors cursor-pointer text-sm"
                    title="Limpar campos"
                  >
                    Limpar
                  </button>
                )}
              </div>
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
                                  
                                  {/* Badges de Espécie e Tipo */}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                      item.especie === "Cão"
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : item.especie === "Gato"
                                        ? "bg-pink-50 text-pink-700 border border-pink-200"
                                        : "bg-purple-50 text-purple-700 border border-purple-200"
                                    }`}>
                                      {item.especie === "Cão" ? "🐕 Cão" : item.especie === "Gato" ? "🐈 Gato" : "🐾 Cão e Gato"}
                                    </span>
                                    
                                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                      item.tipo === "Comprimido"
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-teal-50 text-teal-700 border border-teal-200"
                                    }`}>
                                      {item.tipo === "Comprimido" ? "💊 Comprimido" : "💧 Transdérmico"}
                                    </span>
                                  </div>

                                  <span className={`text-xs mt-1 block ${isCheapest ? "text-[#166534]/80" : "text-[#6b7280]"}`}>
                                    Dose: {item.pesoTratado} kg / {item.tipo === "Comprimido" ? "comp." : "aplic."} • Caixa: {formatarMoeda(item.precoCaixa)} ({item.qtdComprimidosCaixa} {item.tipo === "Comprimido" ? "comp." : "unid."} a {formatarMoeda(item.precoPorComprimido)}/cada)
                                  </span>
                                </div>
                              </td>
  
                              {/* Dose de cobertura */}
                              <td className="py-4 px-4 text-right font-mono text-xs font-semibold">
                                {item.pesoTratado} kg / {item.tipo === "Comprimido" ? "comp." : "aplic."}
                              </td>
  
                              {/* Quantidade Calculada */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className="font-mono font-bold text-sm sm:text-base">
                                    {formatarNumero(item.quantidade)} {item.tipo === "Comprimido" ? "comp." : "unid."}
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
  
                  {/* Resumo da melhor opção */}
                  {resultados.length > 0 && (
                    <div className="m-6 mt-auto p-5 bg-gradient-to-r from-[#166534] to-[#14532d] text-white rounded-lg shadow-md flex flex-col gap-4 border border-[#15803d]/30">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#4ade80]" />
                          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#bbf7d0]">Melhor Opção de Tratamento</h3>
                        </div>
                        {resultados.length > 1 && (
                          <span className="text-[10px] font-bold bg-[#4ade80]/20 text-[#4ade80] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            Mais Econômico
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <span className="text-[10px] text-white/75 uppercase tracking-wider font-mono block">Produto</span>
                          <span className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                            {resultados[0].nome}
                            <span className="text-[10px] px-1 py-0.5 bg-white/10 rounded font-normal font-sans">
                              {resultados[0].tipo === "Comprimido" ? "💊 comp." : "💧 transd."}
                            </span>
                          </span>
                        </div>
                        <div className="text-left sm:text-center">
                          <span className="text-[10px] text-white/75 uppercase tracking-wider font-mono block">Quantidade Necessária</span>
                          <span className="font-mono font-bold text-sm sm:text-base">
                            {formatarNumero(resultados[0].quantidade)} {resultados[0].tipo === "Comprimido" ? "comp." : "unid."} ({resultados[0].caixas} {resultados[0].caixas === 1 ? 'caixa' : 'caixas'})
                          </span>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-white/75 uppercase tracking-wider font-mono block">Valor Total</span>
                          {temDescontoAtivo ? (
                            <div className="flex flex-col sm:items-end">
                              <span className="text-xs text-white/60 line-through font-mono leading-none mb-0.5">
                                {formatarMoeda(resultados[0].precoTotalOriginal)}
                              </span>
                              <span className="text-lg sm:text-xl font-black font-mono text-[#4ade80]">
                                {formatarMoeda(resultados[0].precoTotal)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg sm:text-xl font-black font-mono">{formatarMoeda(resultados[0].precoTotal)}</span>
                          )}
                        </div>
                      </div>
  
                      {resultados.length > 1 && (
                        <div className="text-xs text-[#bbf7d0] bg-white/5 px-3 py-2 rounded-md flex items-center justify-between border border-white/5 font-medium">
                          <span>Economia em relação à segunda opção ({resultados[1].nome}):</span>
                          <span className="font-bold font-mono text-sm">
                            {formatarMoeda(resultados[1].precoTotal - resultados[0].precoTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
  
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
                  
                  {/* Formulário para Adicionar */}
                  <div className="bg-white p-5 rounded-lg border border-[#e5e7eb] shadow-2xs flex flex-col gap-4">
                    <h3 className="font-semibold text-[#111827] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#4f46e5]" />
                      Cadastrar Novo Vermífugo
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

                      {/* Botão de Enviar */}
                      <div className="md:col-span-3">
                        <button
                          type="submit"
                          className="w-full h-10 bg-[#4f46e5] hover:bg-[#4f46e5]/95 text-white font-semibold rounded-md text-sm transition-colors cursor-pointer text-center focus:outline-hidden focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2"
                        >
                          Adicionar Produto
                        </button>
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
                      <button
                        type="button"
                        onClick={handleRestaurarPadrao}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restaurar Padrão de Fábrica
                      </button>
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
                              <td className="py-3 px-4 font-semibold text-[#111827]">{m.nome}</td>
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
                                <button
                                  type="button"
                                  onClick={() => handleExcluirMedicamento(m.id)}
                                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Excluir Vermífugo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
