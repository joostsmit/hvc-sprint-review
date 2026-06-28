# HVC Sprint Review

Sprint review rapportage tool voor het team **Installaties & Onderhoud** bij HVC. Vervangt een n8n-workflow door een Next.js app op Vercel (gratis tier).

## Wat doet het

- Haalt sprintdata op uit **Azure DevOps** (work items, voortgang, velocity)
- Genereert een **AI-samenvatting** via de Anthropic Claude API
- Toont een interactief dashboard met KPI's, voltooiingspercentages en velocity-grafiek
- Slaat rapporten permanent op via **Vercel Blob** met een stabiele deelbare link
- Beheerpagina voor sprintdoelen en het publiceren van rapporten

## Routes

| Route | Beschrijving |
|---|---|
| `/sprint` | Huidig sprint rapport (live gegenereerd) |
| `/sprint/overzicht` | Overzicht van de laatste 5 sprints |
| `/sprint/[id]` | Gepubliceerd rapport via vaste link |
| `/sprint/beheer` | Sprintdoelen beheren en rapporten publiceren |

## Technische stack

- **Next.js 15** (App Router, Server Components)
- **Vercel Blob** — opslag voor rapporten, sprintdoelen en concepten
- **Azure DevOps REST API** — work items en sprint iteraties
- **Anthropic Claude API** (`claude-sonnet-4-5`) — AI-samenvatting in het Nederlands
- **Vercel Analytics** — paginagebruik

## Lokaal ontwikkelen

```bash
npm install
npm run dev
```

Maak een `.env.local` aan met de volgende variabelen:

```env
AZURE_DEVOPS_PAT=           # Personal Access Token met read-rechten op work items
ANTHROPIC_API_KEY=          # Anthropic API key
BLOB_READ_WRITE_TOKEN=      # Vercel Blob token (automatisch ingesteld bij Vercel deployment)
```

## Deployment

Het project draait op **Vercel**. Push naar `main` om automatisch te deployen.

De Vercel Blob store moet gekoppeld zijn aan het project via de Vercel dashboard (Storage → Connect Project).

De functie-timeout is ingesteld op 60 seconden (`vercel.json`) vanwege de Claude API-aanroep.

## Azure DevOps configuratie

- **Organisatie:** `hvcgroep`
- **Project:** `EAM AB Beheer en Ontwikkeling`
- **Team:** `Installaties & Onderhoud`
- Work item fields: Title, WorkItemType, State, Effort

### Filterlogica

- **Upload-taken:** type `Task` met tag `upload` (hoofdletterongevoelig)
- **Topdesk-taken:** type `Task` met titel die overeenkomt met patroon `M\d+-\d+` of `W \d+`
