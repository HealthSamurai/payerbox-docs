# Demo: EHR (Prior Auth)

Open: [https://cms-ehr.aidbox.app](https://cms-ehr.aidbox.app/)

Branded **Priorbox — Prior Auth App**. An EHR simulator with a built-in developer console that exercises the Da Vinci ePA stack end-to-end:

1. **CRD** — provider selects a service that requires prior authorization; the EHR fires the `order-sign` hook; the payer's coverage service returns a CDS Hooks card with a Launch DTR link.
2. **DTR** — provider launches the DTR SMART app from the card; CQL runs client-side; the app gathers required documentation into a `QuestionnaireResponse`.
3. **PAS** — provider submits the PAS Request Bundle (`Claim` + supporting resources + `QuestionnaireResponse`) to the payer; the payer returns a `ClaimResponse` with the determination.

The demo is a complete reference implementation: CRD hooks fire, DTR forms render and execute CQL, PAS round-trips through an X12 278 simulator.

Sign-in is required to use the demo. Contact Health Samurai for credentials.

