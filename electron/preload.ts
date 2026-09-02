import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("app", {
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (settings: unknown) => ipcRenderer.invoke("settings:save", settings),
    chooseRootFolder: () => ipcRenderer.invoke("settings:chooseRootFolder"),
  },
  empresas: {
    list: () => ipcRenderer.invoke("empresas:list"),
    create: (nome: string) => ipcRenderer.invoke("empresas:create", nome),
    delete: (nome: string) => ipcRenderer.invoke("empresas:delete", nome),
    rename: (oldNome: string, newNome: string) => ipcRenderer.invoke("empresas:rename", oldNome, newNome),
  },
  clienteDados: {
    get: (empresa: string) => ipcRenderer.invoke("clienteDados:get", empresa),
    save: (empresa: string, dados: unknown) => ipcRenderer.invoke("clienteDados:save", empresa, dados),
  },
  clienteDetalhes: {
    get: (empresa: string) => ipcRenderer.invoke("clienteDetalhes:get", empresa),
    save: (empresa: string, detalhes: unknown) => ipcRenderer.invoke("clienteDetalhes:save", empresa, detalhes),
  },
  visitas: {
    listMeses: (empresa: string) => ipcRenderer.invoke("visitas:listMeses", empresa),
    listVisitas: (empresa: string, mes: string) => ipcRenderer.invoke("visitas:listVisitas", empresa, mes),
    create: (ref: unknown) => ipcRenderer.invoke("visitas:create", ref),
    delete: (ref: unknown) => ipcRenderer.invoke("visitas:delete", ref),
  },
  arquivos: {
    list: (ref: unknown) => ipcRenderer.invoke("arquivos:list", ref),
    pickFiles: () => ipcRenderer.invoke("arquivos:pickFiles"),
    add: (ref: unknown, sourcePaths: string[]) => ipcRenderer.invoke("arquivos:add", ref, sourcePaths),
    remove: (ref: unknown, fileName: string) => ipcRenderer.invoke("arquivos:remove", ref, fileName),
    rename: (ref: unknown, oldName: string, newName: string) =>
      ipcRenderer.invoke("arquivos:rename", ref, oldName, newName),
    openInExplorer: (ref: unknown) => ipcRenderer.invoke("arquivos:openInExplorer", ref),
    openFile: (filePath: string) => ipcRenderer.invoke("arquivos:openFile", filePath),
    showInFolder: (filePath: string) => ipcRenderer.invoke("arquivos:showInFolder", filePath),
    startDrag: (filePaths: string[]) => ipcRenderer.send("arquivos:startDrag", filePaths),
  },
  laudo: {
    get: (ref: unknown) => ipcRenderer.invoke("laudo:get", ref),
    save: (ref: unknown, data: unknown) => ipcRenderer.invoke("laudo:save", ref, data),
    generate: (ref: unknown, data: unknown) => ipcRenderer.invoke("laudo:generate", ref, data),
  },
  media: {
    onRename: (callback: (filePath: string) => void) => {
      const listener = (_event: unknown, filePath: string) => callback(filePath);
      ipcRenderer.on("media:rename", listener);
      return () => ipcRenderer.removeListener("media:rename", listener);
    },
    onRefresh: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on("media:refresh", listener);
      return () => ipcRenderer.removeListener("media:refresh", listener);
    },
  },
  documentacao: {
    list: (categoria: string) => ipcRenderer.invoke("documentacao:list", categoria),
    open: (categoria: string, arquivo: string) => ipcRenderer.invoke("documentacao:open", categoria, arquivo),
    add: (categoria: string) => ipcRenderer.invoke("documentacao:add", categoria),
    rename: (categoria: string, arquivo: string, novoNome: string) =>
      ipcRenderer.invoke("documentacao:rename", categoria, arquivo, novoNome),
  },
  estoque: {
    listGateways: () => ipcRenderer.invoke("estoque:listGateways"),
    createGateway: (vinculo: unknown) => ipcRenderer.invoke("estoque:createGateway", vinculo),
    saveGateway: (id: string, dados: unknown) => ipcRenderer.invoke("estoque:saveGateway", id, dados),
    listPlacas: () => ipcRenderer.invoke("estoque:listPlacas"),
    createPlaca: (vinculo: unknown) => ipcRenderer.invoke("estoque:createPlaca", vinculo),
  },
  anotacoes: {
    list: () => ipcRenderer.invoke("anotacoes:list"),
    create: (dados: unknown) => ipcRenderer.invoke("anotacoes:create", dados),
    save: (id: string, dados: unknown) => ipcRenderer.invoke("anotacoes:save", id, dados),
    delete: (id: string) => ipcRenderer.invoke("anotacoes:delete", id),
    listAnexos: (id: string) => ipcRenderer.invoke("anotacoes:listAnexos", id),
    addAnexos: (id: string, sourcePaths: string[]) => ipcRenderer.invoke("anotacoes:addAnexos", id, sourcePaths),
    removeAnexo: (id: string, fileName: string) => ipcRenderer.invoke("anotacoes:removeAnexo", id, fileName),
  },
});
