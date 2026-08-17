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
    openInExplorer: (ref: unknown) => ipcRenderer.invoke("arquivos:openInExplorer", ref),
    openFile: (filePath: string) => ipcRenderer.invoke("arquivos:openFile", filePath),
    showInFolder: (filePath: string) => ipcRenderer.invoke("arquivos:showInFolder", filePath),
  },
  laudo: {
    get: (ref: unknown) => ipcRenderer.invoke("laudo:get", ref),
    save: (ref: unknown, data: unknown) => ipcRenderer.invoke("laudo:save", ref, data),
    generate: (ref: unknown, data: unknown) => ipcRenderer.invoke("laudo:generate", ref, data),
  },
});
