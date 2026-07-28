'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ClipboardCheck, Gavel, ShieldCheck, Store } from 'lucide-react';
import { useApp } from '@/app/provedor';
import { listarPerfis, ROTA_DO_PAPEL } from '@/adapter/sessao';
import type { Papel, Perfil } from '@/dominio/tipos';
import { Botao } from '@/components/ui/button';
import { Ficha, FichaCabecalho, FichaCorpo, FichaSobrescrito, FichaTitulo } from '@/components/ui/ficha';
import { Aviso } from '@/components/ui/aviso';

/**
 * Acesso por perfil (US2, FR-017 a FR-022).
 *
 * **Fronteira ética, registrada em `contracts/acesso-simulado.md`:** esta tela
 * encena um login. Não existe campo de senha, de e-mail ou de CPF, e nenhuma
 * marca de provedor de identidade real é reproduzida. Uma tela de login
 * convincente que imite o gov.br é funcionalmente um kit de phishing, ainda que
 * sem intenção — e o projeto é avaliado pelo UNICEF.
 *
 * O fluxo de identidade pretendido em produção é comunicado por texto, não por
 * imitação de interface.
 */

const ICONE: Record<Papel, typeof Building2> = {
  gestor: Building2,
  oraculo: Store,
  conselho: ClipboardCheck,
  controle: Gavel,
};

const O_QUE_FAZ: Record<Papel, string> = {
  gestor:
    'Registra as compras de merenda. Recebe o bloqueio na hora, com a comparação de preços que motivou a recusa.',
  oraculo:
    'Reporta o preço praticado no mercado e recalcula a referência. Nenhuma fonte sozinha define o preço.',
  conselho:
    'Confirma que os alimentos chegaram à escola. Sem duas confirmações de partes distintas, o fornecedor não recebe.',
  controle:
    'Audita em tempo real os alertas de rejeição, as pendências de entrega vencidas e as divergências abertas.',
};



export default function Entrar() {
  const { perfil, despachar } = useApp();
  const router = useRouter();
  const perfis = listarPerfis();

  function entrar(p: Perfil) {
    despachar({ tipo: 'entrar', perfilId: p.id });
    router.push(ROTA_DO_PAPEL[p.papel]);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="sobrescrito">Ambiente simulado</p>
      <h1 className="mt-2">Escolha um perfil de demonstração</h1>
      <p className="mt-3 max-w-2xl text-xs text-grafite">
        Cada ator do ecossistema vê e pode fazer coisas diferentes. Selecionar um cartão é
        o ato de entrar — você pode trocar de perfil a qualquer momento.
      </p>

      <Aviso
        tom="informativo"
        titulo="Nenhuma credencial é solicitada, aceita ou armazenada"
        className="mt-6"
      >
        <p>
          Esta tela não tem campo de senha, e-mail ou CPF, e não reproduz a identidade
          visual de nenhum provedor de identidade real. É encenação de produto.
        </p>
        <p className="mt-2">
          Em produção, o acesso se daria por login social sem manuseio direto de chaves
          privadas, integrado ao sistema da secretaria — descrito aqui em texto, e
          deliberadamente <strong>não</strong> imitado em interface.
        </p>
      </Aviso>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {perfis.map((p) => {
          const Icone = ICONE[p.papel];
          const ativo = perfil?.id === p.id;
          return (
            <Ficha key={p.id} trilho={ativo ? 'indice' : 'neutro'}>
              <FichaCabecalho>
                <Icone aria-hidden="true" className="size-5 text-indice" />
                <FichaSobrescrito>{p.cargo}</FichaSobrescrito>
                <FichaTitulo>{p.nome}</FichaTitulo>
                <p className="text-2xs text-grafite">{p.instituicao}</p>
              </FichaCabecalho>
              <FichaCorpo className="space-y-4">
                <p className="text-xs text-grafite">{O_QUE_FAZ[p.papel]}</p>
                <Botao
                  variante={ativo ? 'contorno' : 'principal'}
                  onClick={() => entrar(p)}
                  className="w-full"
                >
                  {ativo ? 'Continuar como ' : 'Entrar como '}
                  {p.nome.split(' ')[0]}
                </Botao>
              </FichaCorpo>
            </Ficha>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-regua pt-6">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-grafite" />
        <p className="text-2xs text-grafite">
          Prefere não entrar? O{' '}
          <Link href="/transparencia" className="text-indice underline underline-offset-2">
            painel público
          </Link>{' '}
          é aberto a qualquer pessoa, sem cadastro — é assim que um cidadão ou jornalista
          usaria o sistema.
        </p>
      </div>
    </main>
  );
}
