import { Component, type ReactNode } from "react";

interface Props {
  route: string;
  onHome: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Contém qualquer quebra de render numa rota: mostra o erro em vez de congelar. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private retry = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-3xl bg-[#151517] p-6 text-center ring-1 ring-red-600/40">
          <p className="font-display text-2xl font-extrabold italic">ALGO TRAVOU AQUI</p>
          <p className="mt-1 text-xs text-zinc-400">
            Tela: <b className="text-zinc-200">{this.props.route}</b> — avise o suporte com a mensagem abaixo:
          </p>
          <p className="mx-auto mt-3 max-w-full overflow-x-auto rounded-xl bg-black/50 p-3 text-left font-mono text-[11px] text-red-300 ring-1 ring-white/10">
            {String(error.message || error)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={this.retry} className="press rounded-2xl bg-white/10 py-3 text-xs font-extrabold ring-1 ring-white/15">
              TENTAR DE NOVO
            </button>
            <button onClick={this.props.onHome} className="press rounded-2xl bg-sparta-600 py-3 text-xs font-extrabold">
              VOLTAR AO INÍCIO
            </button>
          </div>
          <button onClick={() => window.location.reload()} className="mt-2 w-full rounded-2xl py-2 text-[11px] font-bold text-zinc-500">
            Recarregar o app
          </button>
        </div>
      </div>
    );
  }
}
