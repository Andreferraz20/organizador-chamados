interface PerguntaGuia {
  pergunta: string;
  exemploLabel: string;
  exemplo: string[];
  instrucoes: string;
}

interface NotaGuia {
  titulo: string;
  itens: string[];
}

export interface GuiaLaudo {
  titulo: string;
  perguntas: PerguntaGuia[];
  notas: NotaGuia[];
}

export const GUIA_AVALIACAO_TECNICA: GuiaLaudo = {
  titulo: "Laudo Avaliação Técnica",
  perguntas: [
    {
      pergunta:
        "1. Confirmar o número de série dos equipamentos avaliados e a sua sequência. (Exemplo: 1234567890 - ST1)",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["S2 – 2409059888"],
      instrucoes:
        "Indicar obrigatoriamente a série e sequência do material, podendo ser máquinas ou periféricos (Bomba, Suporte ou Gateway).",
    },
    {
      pergunta:
        "2. Descrever os testes e procedimentos realizados, indicar código (PN) das peças danificadas, se houver (anexar foto) e, indicar série do equipamento.",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: [
        "Foi feito o teste de temperatura na máquina devido a reclamação de que não estavam secando as roupas e, não passou de 40ºC.",
        "Foi aberto a máquina para verificação dos componentes e visto que a resistência não estava apresentando continuidade.",
        "Foi vista a resistência do aterramento da lavanderia e apresentou 0,1 Ohms, a tensão da tomada estava em 220V e 12V na placa.",
        "Com esses testes é possível validar que é necessário a troca da resistência e a infraestrutura está dentro dos padrões estabelecidos.",
      ],
      instrucoes:
        "Indicar obrigatoriamente os testes bem descritos como identificou o problema no equipamento em questão. (Com fotos)",
    },
    {
      pergunta:
        "3. Foi utilizado algum material do estoque técnico? Indicar equipamento (série e posição), código da peça (PN) e quantidade. (Em troca de gateway indicar número de série do material)",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["Não foi utilizado estoque técnico."],
      instrucoes:
        'Obrigatoriamente nessa pergunta o técnico preencha com "Não" ou "Sim", em caso de sim, indicar qual material, caso tenha série indicar a série que foi tirada do estoque dele (e devolver a danificada o quanto antes). (Com fotos)',
    },
    {
      pergunta: "4. Indique série e posição do equipamento interditado (se houver). (Exemplo: 1234567890 - S1)",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["S2 – 2409059888"],
      instrucoes:
        'Obrigatoriamente o técnico deve preencher com a máquina que vai ficar inoperante até a próxima visita, caso não tenha necessidade só colocar "N/A".',
    },
    {
      pergunta:
        "5. Indicar as condições de organização e limpeza dos equipamentos e espaço da lavanderia. Foi necessário tomar alguma ação?",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["A lavanderia estava limpa, ao sair, foi deixada do mesmo estado."],
      instrucoes:
        "Obrigatoriamente nessa pergunta o técnico preencha como foi encontrado a lavanderia e ao sair do local como deixou. (Com fotos se necessário)",
    },
    {
      pergunta:
        "6. Realizar teste de liberação dos equipamentos (APP/FICHA) a depender da forma de pagamento do cliente e fazer ciclo teste.",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["Não foi possível realizar o teste pois a máquina ficou interditada."],
      instrucoes:
        'Obrigatoriamente nessa pergunta o técnico preencha com o teste "final" com liberação no sistema de pagamento do cliente + ciclo com a máquina funcionando. (Caso o equipamento esteja interditado, indicar que não foi possível realizar o teste). (Vídeo)',
    },
    {
      pergunta: "7. Indicar nome e cargo de quem acompanhou.",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["Sr. Antônio – Zelador"],
      instrucoes: "Queremos que nessa pergunta o técnico preencha com o nome e cargo de quem acompanhou.",
    },
    {
      pergunta:
        "8. Atualização cadastral: Indicar nome, cargo e telefone do responsável pela administração do condomínio (Síndico/Gerente Predial).",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: ["Sr. João - Síndico – 11965789999"],
      instrucoes:
        "Queremos que nessa pergunta o técnico preencha com as informações solicitadas, mesmo que seja a mesma pessoa acima, e questione a informação para quem acompanhou.",
    },
    {
      pergunta:
        "9. Observações gerais, sugestões e melhorias (Infra/Área Técnica/Identidade Visual e utilização).",
      exemploLabel: "Exemplo de Resposta:",
      exemplo: [
        "Um ponto a se destacar nessa visita, foi que a borracha da lavadora estava suja, foi feito a limpeza e orientado ao zelador mantê-la limpa, conforme orientação identificada na identidade visual da mesma.",
      ],
      instrucoes:
        "Queremos que o técnico preencha de forma clara pontos necessários que entende que não cabem nas perguntas anteriores. (Com fotos se necessário)",
    },
  ],
  notas: [
    {
      titulo: "Exemplo de fotos no acompanhamento:",
      itens: [
        "Foto da série",
        "Foto da máquina aberta",
        "Foto da peça avaliada",
        "Vídeo da máquina com o problema acontecendo",
      ],
    },
    {
      titulo: "Em caso de garantia (além das fotos padrões, registrar):",
      itens: [
        "Foto da medição do aterramento.",
        "Foto da medição da tensão e voltagem.",
        "Foto da medição da pressão da água.",
        "Foto da infraestrutura relacionada ao problema (se houver).",
        "Foto do quadro geral e disjuntores (somente se acompanhado pelo responsável da lavanderia).",
      ],
    },
  ],
};

export function LaudoGuiaModal({ guia, onClose }: { guia: GuiaLaudo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Como preencher o laudo</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          <p className="bg-blue-100 py-2 text-center text-sm font-bold uppercase text-slate-800 dark:bg-blue-950 dark:text-blue-100">
            {guia.titulo}
          </p>

          <div className="space-y-3 p-4">
            {guia.perguntas.map((p, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="whitespace-pre-line bg-slate-100 px-4 py-2 text-center text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {p.pergunta}
                </p>
                <div className="bg-white px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span className="font-bold italic">{p.exemploLabel}</span>{" "}
                  {p.exemplo.length === 1 ? (
                    <span>{p.exemplo[0]}</span>
                  ) : (
                    <div className="mt-1 space-y-0.5">
                      {p.exemplo.map((linha, j) => (
                        <p key={j}>- {linha}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-slate-200">
                  <span className="font-bold italic text-amber-700 dark:text-amber-400">
                    Instruções de preenchimento:
                  </span>{" "}
                  {p.instrucoes}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 px-4 pb-4 text-sm text-slate-700 dark:text-slate-200">
            {guia.notas.map((nota, i) => (
              <div key={i}>
                <p className="font-bold italic">{nota.titulo}</p>
                {nota.itens.map((item, j) => (
                  <p key={j}>{item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
