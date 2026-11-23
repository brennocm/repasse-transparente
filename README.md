# RepasseTransparente

Cryptographic auditing, price oracles and traceability of public funds for early childhood and education in Brazil.

**Demo:** [repasse-transparente.vercel.app](https://repasse-transparente.vercel.app) (the interface is in Portuguese)

Prototype built for the **UNICEF Youth Challenge Blockchain 2026**, the UNICEF x Superteam Brasil / Blockchain.RIO Ideathon.

> **This is a demo prototype.** All data is fictitious. No municipality, school, company or
> person shown here exists. The smart program logic is **simulated in software**: there is no
> blockchain, wallet or real transaction.

---

## The problem

School meals are among the most frequent targets of overpricing in municipal procurement. By
the time an audit arrives, years later, the money is already spent and the child has already
eaten, or gone without.

## The proposal

Replace reactive auditing with a **preventive lock**. Independent sources report market
prices; the reference price is the **median** of those quotes; any purchase proposal above the
median plus a tolerance is **blocked before payment**.

The median, not the mean, because a single compromised source reporting an absurd value skews
the whole mean, and does not move the median.

Settlement happens in **BRZ**, a stablecoin pegged 1:1 to the Brazilian real. The accounting
entry and the payment become the same operation, so there is no gap between the two where
fraud usually hides.

## What this prototype shows

- The lock rejecting a milk purchase 90% above the reference price, with the money saved
  converted into school meals
- How the median is formed from five sources of different categories, and how it resists
  manipulation
- A hash-chained ledger where any retroactive change is detectable: you can tamper with a
  record and watch the verification point to it
- The four actors of the ecosystem, each with its own view of the system
- A public transparency dashboard, open without sign-up
- Settlement in BRZ: the money leaves the city's account, is held in custody, and only
  reaches the supplier after two delivery confirmations
- The audit of the Anchor program itself, with the limitations it still has, including the
  two flaws the escrow introduced

## What it is not

There is no blockchain: no transaction touches Solana, and no real BRZ moves. There is no
backend, database or real authentication. The sign-in is a product mock-up and collects no
credentials. Nothing here is ready to handle public money.

---

## Methodology

The project is built by AI agents with **spec-driven development**, using the GitHub Spec Kit
format adapted to Claude Code. The specification documents are in Portuguese.

| Document | Contents |
|---|---|
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | The seven non-negotiable principles |
| [`specs/001-repasse-transparente/spec.md`](specs/001-repasse-transparente/spec.md) | What and why: 8 stories, 58 functional and 8 non-functional requirements |
| [`specs/001-repasse-transparente/research.md`](specs/001-repasse-transparente/research.md) | Technical decisions and the audit of the Anchor program |
| [`specs/001-repasse-transparente/plan.md`](specs/001-repasse-transparente/plan.md) | How: stack, structure, sequencing |
| [`specs/001-repasse-transparente/data-model.md`](specs/001-repasse-transparente/data-model.md) | Entities, invariants, state machine |
| [`specs/001-repasse-transparente/design-direction.md`](specs/001-repasse-transparente/design-direction.md) | Palette with measured contrast, typography, layout, signature |
| [`specs/001-repasse-transparente/contracts/`](specs/001-repasse-transparente/contracts/) | Interfaces between modules |
| [`specs/001-repasse-transparente/mock-data.md`](specs/001-repasse-transparente/mock-data.md) | The fictitious dataset, with the numbers checked |
| [`specs/001-repasse-transparente/tasks.md`](specs/001-repasse-transparente/tasks.md) | 85 tasks, all done and traced to requirements |
| [`specs/001-repasse-transparente/quickstart.md`](specs/001-repasse-transparente/quickstart.md) | Manual verification script |

### Commands

```
/speckit:constitution   sets or amends the principles
/speckit:specify        writes the specification of a feature
/speckit:clarify        surfaces ambiguities before planning
/speckit:plan           decides the technical approach
/speckit:tasks          breaks it into executable tasks
/speckit:analyze        checks consistency across the artifacts
/speckit:implement      runs it
```

---

## Running it

```bash
git clone https://github.com/brennocm/repasse-transparente.git
cd repasse-transparente
npm install
npm run test    # 254 assertions
npm run dev
```

## Stack

Next.js with static export, strict TypeScript, Tailwind CSS, shadcn/ui, Vitest.
No backend, no database, no environment variables, no network dependency at runtime.

## License

[MIT](LICENSE).
