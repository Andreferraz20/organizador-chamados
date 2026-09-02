export interface TipoVisitaConfig {
  label: string;
  /** Sigla usada no nome da pasta no Windows, ex: "CORRETIVA" */
  sigla: string;
}

export interface AppSettings {
  rootFolder: string | null;
  tiposDeVisita: TipoVisitaConfig[];
  tecnicoNome: string;
  tecnicoEmpresa: string;
}

export interface VisitaRef {
  empresa: string;
  /** Formato AAAA-MM, ex: "2026-08" */
  mes: string;
  /** Formato DD, ex: "13" */
  dia: string;
  tipoVisita: string;
}

export interface LaudoData {
  empresa: string;
  data: string;
  tipoVisita: string;
  numeroSerie: string;
  laudoTecnico: string;
  pecasSolicitadas: string;
  materialEstoque: string;
  acompanhante: string;
  geradoEm: string;
}

export interface FileEntry {
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
}

export interface Pessoa {
  nome: string;
  contato: string;
  cargo: string;
  email: string;
}

export interface NumeroSerie {
  numero: string;
  tipoMaquina: string;
}

export interface ClienteDados {
  nome: string;
  endereco: string;
  quantidadeBocas: string;
  numerosSerie: NumeroSerie[];
  pessoas: Pessoa[];
}

export interface LaudoRef {
  mes: string;
  dia: string;
  tipoVisita: string;
}

export interface ProblemaDetalhe {
  titulo: string;
  descricao: string;
  data: string;
  laudoRef?: LaudoRef | null;
}

export interface ClienteDetalhes {
  problemas: ProblemaDetalhe[];
}

export interface EstoqueVinculo {
  cliente: string;
  /** Formato AAAA-MM-DD, ou null quando a data não é conhecida (registro antigo, anterior ao app). */
  data: string | null;
  /** Presente quando vinculado a uma visita técnica existente — dá acesso ao Laudo Técnico. */
  visitaRef: VisitaRef | null;
}

export interface GatewayItem extends EstoqueVinculo {
  id: string;
  idAnterior: string;
  idNovo: string;
}

export interface PlacaWirelessItem extends EstoqueVinculo {
  id: string;
}

export interface AnotacaoTecnica {
  id: string;
  titulo: string;
  /** Formato AAAA-MM-DD. */
  data: string;
  texto: string;
}

export type DocCategoria = "infraestrutura" | "tecnico" | "usuario";

export interface DocumentoInfo {
  /** Nome de exibição, sem extensão. */
  nome: string;
  /** Nome do arquivo em disco, com extensão. */
  arquivo: string;
}

export interface AppApi {
  settings: {
    get(): Promise<AppSettings>;
    save(settings: AppSettings): Promise<AppSettings>;
    chooseRootFolder(): Promise<string | null>;
  };
  empresas: {
    list(): Promise<string[]>;
    create(nome: string): Promise<void>;
    delete(nome: string): Promise<boolean>;
    rename(oldNome: string, newNome: string): Promise<string>;
  };
  clienteDados: {
    get(empresa: string): Promise<ClienteDados | null>;
    save(empresa: string, dados: ClienteDados): Promise<void>;
  };
  clienteDetalhes: {
    get(empresa: string): Promise<ClienteDetalhes | null>;
    save(empresa: string, detalhes: ClienteDetalhes): Promise<void>;
  };
  visitas: {
    listMeses(empresa: string): Promise<string[]>;
    listVisitas(empresa: string, mes: string): Promise<{ dia: string; tipoVisita: string }[]>;
    create(ref: VisitaRef): Promise<void>;
    delete(ref: VisitaRef): Promise<boolean>;
  };
  arquivos: {
    list(ref: VisitaRef): Promise<FileEntry[]>;
    pickFiles(): Promise<string[]>;
    add(ref: VisitaRef, sourcePaths: string[]): Promise<FileEntry[]>;
    remove(ref: VisitaRef, fileName: string): Promise<void>;
    rename(ref: VisitaRef, oldName: string, newName: string): Promise<void>;
    openInExplorer(ref: VisitaRef): Promise<void>;
    openFile(filePath: string): Promise<void>;
    showInFolder(filePath: string): Promise<void>;
    startDrag(filePaths: string[]): void;
  };
  laudo: {
    get(ref: VisitaRef): Promise<LaudoData | null>;
    save(ref: VisitaRef, data: LaudoData): Promise<void>;
    generate(ref: VisitaRef, data: LaudoData): Promise<string>;
  };
  media: {
    onRename(callback: (filePath: string) => void): () => void;
    onRefresh(callback: () => void): () => void;
  };
  documentacao: {
    list(categoria: DocCategoria): Promise<DocumentoInfo[]>;
    open(categoria: DocCategoria, arquivo: string): Promise<void>;
    add(categoria: DocCategoria): Promise<DocumentoInfo[]>;
    rename(categoria: DocCategoria, arquivo: string, novoNome: string): Promise<DocumentoInfo[]>;
  };
  estoque: {
    listGateways(): Promise<GatewayItem[]>;
    createGateway(vinculo: EstoqueVinculo): Promise<GatewayItem>;
    saveGateway(id: string, dados: { idAnterior: string; idNovo: string }): Promise<GatewayItem>;
    listPlacas(): Promise<PlacaWirelessItem[]>;
    createPlaca(vinculo: EstoqueVinculo): Promise<PlacaWirelessItem>;
  };
  anotacoes: {
    list(): Promise<AnotacaoTecnica[]>;
    create(dados: { titulo: string; data: string; texto: string }): Promise<AnotacaoTecnica>;
    save(id: string, dados: { titulo: string; data: string; texto: string }): Promise<AnotacaoTecnica>;
    delete(id: string): Promise<boolean>;
    listAnexos(id: string): Promise<FileEntry[]>;
    addAnexos(id: string, sourcePaths: string[]): Promise<FileEntry[]>;
    removeAnexo(id: string, fileName: string): Promise<void>;
  };
}

declare global {
  interface Window {
    app: AppApi;
  }
}
