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

export interface ClienteDados {
  nome: string;
  endereco: string;
  pessoas: Pessoa[];
}

export interface ProblemaDetalhe {
  titulo: string;
  descricao: string;
  data: string;
}

export interface ClienteDetalhes {
  problemas: ProblemaDetalhe[];
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
}

declare global {
  interface Window {
    app: AppApi;
  }
}
