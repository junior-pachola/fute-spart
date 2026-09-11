export type Route =
  | "inicio"
  | "atletas"
  | "agenda"
  | "jogos"
  | "noticias"
  | "galeria"
  | "parceiros"
  | "projetos"
  | "documentos"
  | "notificacoes"
  | "fale"
  | "config";

export interface Atleta {
  nome: string;
  posicao: string;
  nasc: string;
  numero: number;
}

export const atletas: Atleta[] = [
  { nome: "GABRIEL SOUZA", posicao: "Meia Atacante", nasc: "15/03/2011", numero: 10 },
  { nome: "KAUAN LIMA", posicao: "Zagueiro", nasc: "22/01/2011", numero: 4 },
  { nome: "MIGUEL FERREIRA", posicao: "Atacante", nasc: "10/07/2011", numero: 9 },
  { nome: "PEDRO HENRIQUE", posicao: "Lateral Direito", nasc: "05/02/2011", numero: 2 },
  { nome: "LUCAS RIBEIRO", posicao: "Goleiro", nasc: "12/09/2011", numero: 1 },
  { nome: "ENZO GABRIEL", posicao: "Volante", nasc: "03/05/2012", numero: 5 },
  { nome: "MATHEUS SANTOS", posicao: "Ponta Esquerda", nasc: "28/08/2011", numero: 11 },
];

export interface Evento {
  dia: string;
  mes: string;
  hora: string;
  titulo: string;
  detalhe: string;
  tipo: "JOGO" | "TREINO";
}

export const eventos: Evento[] = [
  { dia: "25", mes: "MAI", hora: "15:30", titulo: "JOGO", detalhe: "Spartax x A.E. Clube — Estádio Municipal", tipo: "JOGO" },
  { dia: "27", mes: "MAI", hora: "19:00", titulo: "TREINO", detalhe: "Treino Técnico — CT Spartax", tipo: "TREINO" },
  { dia: "29", mes: "MAI", hora: "08:30", titulo: "TREINO", detalhe: "Treino Físico — CT Spartax", tipo: "TREINO" },
];

export const proximoJogo = {
  casa: "SPARTAX",
  fora: "A.E. CLUBE",
  data: "25/05/2026",
  hora: "15:30",
  local: "ESTÁDIO MUNICIPAL\nWAIPORÃ - PR",
};

export interface Noticia {
  titulo: string;
  data: string;
  categoria: string;
}

export const noticias: Noticia[] = [
  { titulo: "Spartax vence e avança para a próxima fase do Campeonato Regional", data: "21/05/2026", categoria: "Jogos" },
  { titulo: "Treino físico e disciplina: a base da nossa evolução", data: "18/05/2026", categoria: "Treinos" },
  { titulo: "Categoria de base se destaca em amistoso", data: "15/05/2026", categoria: "Base" },
  { titulo: "Parceria com nova empresa fortalece o projeto Spartax", data: "10/05/2026", categoria: "Clube" },
];

export interface Parceiro {
  nome: string;
  tipo: string;
  detalhe: string;
  cor: string;
  letra: string;
}

export const parceiros: Parceiro[] = [
  { nome: "COPEL", tipo: "Patrocinador Oficial", detalhe: "Lei de Incentivo ao Esporte", cor: "bg-orange-500", letra: "⚡" },
  { nome: "CRESOL", tipo: "Apoiador Oficial", detalhe: "Juntos pelo esporte", cor: "bg-green-600", letra: "◎" },
  { nome: "SICREDI", tipo: "Apoiador", detalhe: "Incentivando talentos", cor: "bg-emerald-500", letra: "✳" },
  { nome: "LOJAS MM", tipo: "Apoiador", detalhe: "Parceira do Spartax", cor: "bg-red-600", letra: "M" },
];

export const documentos = [
  "Estatuto da Associação",
  "Regimento Interno",
  "Projetos Aprovados",
  "Prestação de Contas",
  "Relatórios",
  "Atas e Reuniões",
  "Documentos Gerais",
];

export interface Notificacao {
  titulo: string;
  data: string;
  lida: boolean;
}

export const notificacoesIniciais: Notificacao[] = [
  { titulo: "Jogo no domingo!", data: "23/05/2026 - 10:30", lida: false },
  { titulo: "Treino hoje às 19:00", data: "23/05/2026 - 08:15", lida: false },
  { titulo: "Novo parceiro confirmado!", data: "21/05/2026 - 14:45", lida: false },
  { titulo: "Reunião da comissão técnica", data: "20/05/2026 - 18:20", lida: true },
  { titulo: "Documento atualizado", data: "19/05/2026 - 11:05", lida: true },
];

export const projeto = {
  titulo: "PROJETO APROVADO",
  subtitulo: "LEI DE INCENTIVO AO ESPORTE",
  valorTotal: "R$ 341.749,20",
  captado: "R$ 40.000,00",
  aCaptar: "R$ 301.749,20",
  percentual: "11,71%",
  confirmados: [
    { nome: "COPEL", detalhe: "Patrocinador", valor: "R$ 40.000,00" },
    { nome: "CRESOL", detalhe: "Apoiador Oficial", valor: "—" },
    { nome: "SICREDI", detalhe: "Apoiador", valor: "—" },
  ],
};
