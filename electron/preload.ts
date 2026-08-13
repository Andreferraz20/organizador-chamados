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
  },
  visitas: {
    listMeses: (empresa: string) => ipcRenderer.invoke("visitas:listMeses", empresa),
    listDias: (empresa: string, mes: string) => ipcRenderer.invoke("visitas:listDias", empresa, mes),
    listTipos: (empresa: string, mes: string, dia: string) =>
      ipcRenderer.invoke("visitas:listTipos", empresa, mes, dia),
    create: (ref: unknown) => ipcRenderer.invoke("visitas:create", ref),
  },
  arquivos: {
    list: (ref: unknown, categoria: string) => ipcRenderer.invoke("arquivos:list", ref, categoria),
    pickFiles: (categoria: string) => ipcRenderer.invoke("arquivos:pickFiles", categoria),
    add: (ref: unknown, categoria: string, sourcePaths: string[]) =>
      ipcRenderer.invoke("arquivos:add", ref, categoria, sourcePaths),
    remove: (ref: unknown, categoria: string, fileName: string) =>
      ipcRenderer.invoke("arquivos:remove", ref, categoria, fileName),
    openInExplorer: (ref: unknown) => ipcRenderer.invoke("arquivos:openInExplorer", ref),
  },
  laudo: {
    get: (ref: unknown) => ipcRenderer.invoke("laudo:get", ref),
    generate: (ref: unknown, data: unknown) => ipcRenderer.invoke("laudo:generate", ref, data),
  },
});
