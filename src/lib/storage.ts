export type ProtocoloTipo = "dose_unica" | "duas_doses_15_dias";

export interface Medicamento {
  id: string;
  nome: string;
  categoria: string; // "Vermífugo"
  pesoTratado: number;
  precoCaixa: number;
  qtdComprimidosCaixa: number;
  precoPorComprimido: number;
  especie: "Cão" | "Gato" | "Ambos";
  tipo: "Comprimido" | "Transdérmico";
  // Novas propriedades para filtros avançados de atendimento rápido
  idadeMinimaDias: number; // Idade mínima permitida para uso em dias
  exclusivoFilhotes: boolean; // Se o medicamento é exclusivo para filhotes
  trataVermeCoracao: boolean; // Previne/trata verme do coração (Dirofilaria)
  trataGiardia: boolean; // Trata Giárdia
  amploEspectro: boolean; // Vermífugo de amplo espectro
  protocolo?: ProtocoloTipo; // Protocolo do tratamento
}

export interface StorageData {
  versao: number;
  ultimaAtualizacao: string;
  produtos: Medicamento[];
}

export const STORAGE_KEY = "pet_shop_vermifugos";
export const VERSAO_ATUAL = 4; // Incremented version because of the schema update with treatment protocols

export const MEDICAMENTOS_PADRAO: Medicamento[] = [
  { id: "1", nome: "Drontal Plus Sabor Carne (Cães)", categoria: "Vermífugo", pesoTratado: 10, precoCaixa: 62.00, qtdComprimidosCaixa: 4, precoPorComprimido: 15.50, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 15, exclusivoFilhotes: false, trataVermeCoracao: false, trataGiardia: true, amploEspectro: true, protocolo: "dose_unica" },
  { id: "2", nome: "Endogard 30kg (Cães Grandes)", categoria: "Vermífugo", pesoTratado: 30, precoCaixa: 69.80, qtdComprimidosCaixa: 2, precoPorComprimido: 34.90, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 42, exclusivoFilhotes: false, trataVermeCoracao: true, trataGiardia: true, amploEspectro: true, protocolo: "dose_unica" },
  { id: "3", nome: "Endogard 10kg (Cães Médios)", categoria: "Vermífugo", pesoTratado: 10, precoCaixa: 55.60, qtdComprimidosCaixa: 4, precoPorComprimido: 13.90, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 42, exclusivoFilhotes: false, trataVermeCoracao: true, trataGiardia: true, amploEspectro: true, protocolo: "dose_unica" },
  { id: "4", nome: "Milbemax Mastigável (Cães de 5 a 25kg)", categoria: "Vermífugo", pesoTratado: 25, precoCaixa: 90.00, qtdComprimidosCaixa: 2, precoPorComprimido: 45.00, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 42, exclusivoFilhotes: false, trataVermeCoracao: true, trataGiardia: false, amploEspectro: true, protocolo: "dose_unica" },
  { id: "5", nome: "Top Dog Cães 10kg", categoria: "Vermífugo", pesoTratado: 10, precoCaixa: 59.20, qtdComprimidosCaixa: 4, precoPorComprimido: 14.80, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 42, exclusivoFilhotes: false, trataVermeCoracao: true, trataGiardia: true, amploEspectro: true, protocolo: "dose_unica" },
  { id: "6", nome: "Chemital Puppy Cães e Gatos", categoria: "Vermífugo", pesoTratado: 10, precoCaixa: 42.00, qtdComprimidosCaixa: 4, precoPorComprimido: 10.50, especie: "Ambos", tipo: "Comprimido", idadeMinimaDias: 15, exclusivoFilhotes: true, trataVermeCoracao: false, trataGiardia: true, amploEspectro: true, protocolo: "duas_doses_15_dias" },
  { id: "7", nome: "Basken Plus Cães 5kg", categoria: "Vermífugo", pesoTratado: 5, precoCaixa: 35.60, qtdComprimidosCaixa: 4, precoPorComprimido: 8.90, especie: "Cão", tipo: "Comprimido", idadeMinimaDias: 21, exclusivoFilhotes: false, trataVermeCoracao: false, trataGiardia: false, amploEspectro: true, protocolo: "dose_unica" },
  { id: "8", nome: "Profender Spot-on Gatos até 2,5kg", categoria: "Vermífugo", pesoTratado: 2.5, precoCaixa: 75.00, qtdComprimidosCaixa: 1, precoPorComprimido: 75.00, especie: "Gato", tipo: "Transdérmico", idadeMinimaDias: 56, exclusivoFilhotes: false, trataVermeCoracao: false, trataGiardia: false, amploEspectro: true, protocolo: "dose_unica" },
  { id: "9", nome: "Profender Spot-on Gatos de 2,5 a 5kg", categoria: "Vermífugo", pesoTratado: 5, precoCaixa: 88.00, qtdComprimidosCaixa: 1, precoPorComprimido: 88.00, especie: "Gato", tipo: "Transdérmico", idadeMinimaDias: 56, exclusivoFilhotes: false, trataVermeCoracao: false, trataGiardia: false, amploEspectro: true, protocolo: "dose_unica" },
  { id: "10", nome: "Drontal Gatos", categoria: "Vermífugo", pesoTratado: 4, precoCaixa: 48.00, qtdComprimidosCaixa: 4, precoPorComprimido: 12.00, especie: "Gato", tipo: "Comprimido", idadeMinimaDias: 42, exclusivoFilhotes: false, trataVermeCoracao: false, trataGiardia: false, amploEspectro: true, protocolo: "dose_unica" },
];

/**
 * Valida se um objeto qualquer possui a estrutura necessária de um StorageData válido
 */
export function validarEstrutura(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  if (typeof data.versao !== "number") return false;
  if (!Array.isArray(data.produtos)) return false;

  for (const prod of data.produtos) {
    if (!prod || typeof prod !== "object") return false;
    if (typeof prod.id !== "string" || !prod.id.trim()) return false;
    if (typeof prod.nome !== "string" || !prod.nome.trim()) return false;
    
    // Converte e valida pesos/preços/quantidades para garantir resiliência
    const peso = Number(prod.pesoTratado);
    const preco = Number(prod.precoCaixa);
    const qtd = Number(prod.qtdComprimidosCaixa);

    if (isNaN(peso) || peso <= 0) return false;
    if (isNaN(preco) || preco <= 0) return false;
    if (isNaN(qtd) || qtd <= 0) return false;
  }
  return true;
}

/**
 * Trata migrações de dados antigos para manter retrocompatibilidade infinita e sem perda de dados
 */
export function migrarDados(raw: any): StorageData {
  const dataAtual = new Date().toISOString();

  // Caso 1: Array direto (formato antigo da aplicação)
  if (Array.isArray(raw)) {
    const produtosMigrados: Medicamento[] = raw.map((item: any, idx) => {
      const id = item.id || `migrated-${idx}-${Date.now()}`;
      const nome = item.nome || `Medicamento Sem Nome ${idx + 1}`;
      const pesoTratado = typeof item.pesoTratado === "number" && item.pesoTratado > 0 ? item.pesoTratado : 10;
      const qtdComprimidosCaixa = typeof item.qtdComprimidosCaixa === "number" && item.qtdComprimidosCaixa > 0 ? item.qtdComprimidosCaixa : 4;
      const precoCaixa = typeof item.precoCaixa === "number" && item.precoCaixa > 0 ? item.precoCaixa : (item.precoPorComprimido || 10) * qtdComprimidosCaixa;
      const categoria = item.categoria || "Vermífugo";
      const especie = item.especie === "Cão" || item.especie === "Gato" || item.especie === "Ambos" ? item.especie : "Cão";
      const tipo = item.tipo === "Comprimido" || item.tipo === "Transdérmico" ? item.tipo : "Comprimido";
      const idadeMinimaDias = typeof item.idadeMinimaDias === "number" ? item.idadeMinimaDias : 0;
      const exclusivoFilhotes = typeof item.exclusivoFilhotes === "boolean" ? item.exclusivoFilhotes : false;
      const trataVermeCoracao = typeof item.trataVermeCoracao === "boolean" ? item.trataVermeCoracao : false;
      const trataGiardia = typeof item.trataGiardia === "boolean" ? item.trataGiardia : false;
      const amploEspectro = typeof item.amploEspectro === "boolean" ? item.amploEspectro : true;
      const protocolo = item.protocolo === "dose_unica" || item.protocolo === "duas_doses_15_dias" ? item.protocolo : "dose_unica";

      return {
        id,
        nome,
        categoria,
        pesoTratado,
        precoCaixa,
        qtdComprimidosCaixa,
        precoPorComprimido: Number((precoCaixa / qtdComprimidosCaixa).toFixed(4)),
        especie,
        tipo,
        idadeMinimaDias,
        exclusivoFilhotes,
        trataVermeCoracao,
        trataGiardia,
        amploEspectro,
        protocolo
      };
    });

    const novaEstrutura: StorageData = {
      versao: VERSAO_ATUAL,
      ultimaAtualizacao: dataAtual,
      produtos: produtosMigrados
    };

    salvarDados(novaEstrutura);
    return novaEstrutura;
  }

  // Caso 2: Objeto nulo ou malformado
  if (!raw || typeof raw !== "object") {
    const padrao: StorageData = {
      versao: VERSAO_ATUAL,
      ultimaAtualizacao: dataAtual,
      produtos: MEDICAMENTOS_PADRAO
    };
    salvarDados(padrao);
    return padrao;
  }

  // Caso 3: Objeto com estrutura similar, migra versão e complementa dados ausentes
  const versao = typeof raw.versao === "number" ? raw.versao : VERSAO_ATUAL;
  const produtosRaw = Array.isArray(raw.produtos) ? raw.produtos : [];

  const produtosMigrados: Medicamento[] = produtosRaw.map((item: any, idx) => {
    const id = item.id || `migrated-${idx}-${Date.now()}`;
    const nome = item.nome || `Medicamento Sem Nome ${idx + 1}`;
    const pesoTratado = typeof item.pesoTratado === "number" && item.pesoTratado > 0 ? item.pesoTratado : 10;
    const qtdComprimidosCaixa = typeof item.qtdComprimidosCaixa === "number" && item.qtdComprimidosCaixa > 0 ? item.qtdComprimidosCaixa : 4;
    const precoCaixa = typeof item.precoCaixa === "number" && item.precoCaixa > 0 ? item.precoCaixa : 10;
    const precoPorComprimido = typeof item.precoPorComprimido === "number" && item.precoPorComprimido > 0 
      ? item.precoPorComprimido 
      : Number((precoCaixa / qtdComprimidosCaixa).toFixed(4));
    const categoria = item.categoria || "Vermífugo";
    const especie = item.especie === "Cão" || item.especie === "Gato" || item.especie === "Ambos" ? item.especie : "Cão";
    const tipo = item.tipo === "Comprimido" || item.tipo === "Transdérmico" ? item.tipo : "Comprimido";
    const idadeMinimaDias = typeof item.idadeMinimaDias === "number" ? item.idadeMinimaDias : 0;
    const exclusivoFilhotes = typeof item.exclusivoFilhotes === "boolean" ? item.exclusivoFilhotes : false;
    const trataVermeCoracao = typeof item.trataVermeCoracao === "boolean" ? item.trataVermeCoracao : false;
    const trataGiardia = typeof item.trataGiardia === "boolean" ? item.trataGiardia : false;
    const amploEspectro = typeof item.amploEspectro === "boolean" ? item.amploEspectro : true;
    const protocolo = item.protocolo === "dose_unica" || item.protocolo === "duas_doses_15_dias" ? item.protocolo : "dose_unica";

    return {
      id,
      nome,
      categoria,
      pesoTratado,
      precoCaixa,
      qtdComprimidosCaixa,
      precoPorComprimido,
      especie,
      tipo,
      idadeMinimaDias,
      exclusivoFilhotes,
      trataVermeCoracao,
      trataGiardia,
      amploEspectro,
      protocolo
    };
  });

  const novaEstrutura: StorageData = {
    versao: VERSAO_ATUAL,
    ultimaAtualizacao: raw.ultimaAtualizacao || dataAtual,
    produtos: produtosMigrados
  };

  // Se a versão for diferente ou se alterou estrutura, salvamos o novo formato
  if (versao !== VERSAO_ATUAL || JSON.stringify(raw) !== JSON.stringify(novaEstrutura)) {
    novaEstrutura.ultimaAtualizacao = dataAtual;
    salvarDados(novaEstrutura);
  }

  return novaEstrutura;
}

/**
 * Salva a estrutura de dados atualizada no localStorage
 */
export function salvarDados(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar dados no localStorage", e);
  }
}

/**
 * Carrega e migra dados do localStorage
 */
export function carregarDados(): StorageData {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (!salvo) {
    const padrao: StorageData = {
      versao: VERSAO_ATUAL,
      ultimaAtualizacao: new Date().toISOString(),
      produtos: MEDICAMENTOS_PADRAO
    };
    salvarDados(padrao);
    return padrao;
  }

  try {
    const parsed = JSON.parse(salvo);
    return migrarDados(parsed);
  } catch (e) {
    console.error("Erro ao fazer parse do localStorage. Usando padrão de fábrica.", e);
    const padrao: StorageData = {
      versao: VERSAO_ATUAL,
      ultimaAtualizacao: new Date().toISOString(),
      produtos: MEDICAMENTOS_PADRAO
    };
    salvarDados(padrao);
    return padrao;
  }
}

/**
 * Aciona o download de backup como arquivo JSON no navegador
 */
export function exportarBackup(produtos: Medicamento[]): void {
  const data: StorageData = {
    versao: VERSAO_ATUAL,
    ultimaAtualizacao: new Date().toISOString(),
    produtos
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0];
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = url;
  downloadAnchor.download = `petcalcula-backup-${dateStr}.json`;

  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();

  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}
