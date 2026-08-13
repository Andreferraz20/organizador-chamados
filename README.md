# Organizador de Chamados

App desktop (Windows) para técnicos de manutenção organizarem localmente as informações
de cada visita: fotos, vídeos e o laudo técnico. Não depende de internet, nuvem ou banco
de dados — tudo fica organizado em pastas no seu próprio PC.

## Funcionalidades

- Uma pasta por empresa/local atendido.
- Dentro de cada empresa, navegação por Mês → Dia → Tipo de Visita.
- Em cada visita: fotos e vídeos (arrastar-e-soltar ou seleção manual) e um formulário de
  laudo técnico que gera um PDF automaticamente.
- Tipos de visita configuráveis (Ajustes).
- Botão para abrir a pasta da visita direto no Windows Explorer.

## Estrutura de pastas gerada

```
<Pasta Raiz>/
  <Empresa ou Local>/
    <AAAA-MM>/
      <DD>/
        <Tipo de Visita>/
          fotos-videos/
          laudo/
            laudo.json
            laudo.pdf
```

A pasta raiz é escolhida pelo usuário em Ajustes na primeira vez que o app é aberto.

## Rodando em modo desenvolvimento

Pré-requisito: [Node.js](https://nodejs.org) instalado.

```bash
npm install
npm run dev
```

Isso sobe o Vite e abre a janela do Electron automaticamente, com hot-reload.

## Gerando o instalador (.exe)

```bash
npm run build
```

Esse comando faz três coisas em sequência:
1. Checa os tipos TypeScript (`tsc --noEmit`).
2. Compila o app com o Vite (renderer + processo principal do Electron).
3. Empacota tudo com o `electron-builder`, gerando o instalador Windows.

O instalador final fica em `release/Organizador de Chamados Setup <versão>.exe`. Esse
arquivo é autocontido — pode ser copiado para qualquer PC Windows e instalado sem
precisar de Node.js ou de mais nada.

> Como o app não é assinado por um certificado pago de editora, o Windows pode mostrar um
> aviso de "Editor desconhecido" na primeira execução do instalador em um PC novo. Isso é
> esperado para apps pessoais — basta clicar em "Mais informações" → "Executar assim mesmo".

## Stack

Electron + React + TypeScript (Vite) + Tailwind CSS + `@react-pdf/renderer` (geração do
laudo em PDF) + `electron-builder` (empacotamento).
