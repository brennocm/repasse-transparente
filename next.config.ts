import type { NextConfig } from 'next';

/**
 * Exportação estática (NFR-005, NFR-006).
 *
 * Consequência de projeto registrada em research.md, decisão 5: não há segmento
 * dinâmico `[id]` no roteador. Entidades criadas em tempo de execução — um repasse
 * proposto pelo avaliador durante a demonstração — não teriam página pré-gerada.
 * Os detalhes usam parâmetro de consulta, resolvido no cliente.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  typedRoutes: true,
};

export default nextConfig;
