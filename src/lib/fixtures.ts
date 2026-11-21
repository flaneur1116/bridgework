// Local-development fixtures (AI_MOCK=1 only; never used in production).
// Used to exercise the UI and take interface screenshots without an API key.
export const ROHAN_EXTRACT = {
  name: "Rohan Deshpande",
  currentRole: "Project architect",
  yearsExperience: 4,
  city: "Pune",
  summary: "Project architect with four years across residential and commercial work in Pune and Mumbai. Coordinates consultants, owns fit-out budgets and runs design reviews with a developer's sales team.",
  projects: [
    { name: "Two G+22 residential towers", summary: "Design coordination across 9 consultants for a Pune developer", scale: "360 units" },
    { name: "Sales gallery and show flats", summary: "Owned the interior fit-out budget, delivered under budget", scale: "Rs 1.2 crore" },
    { name: "Land parcel feasibility", summary: "Massing, FSI and TDR, unit-mix options, cost per sq ft", scale: "2 parcels" },
    { name: "Textile mill reuse thesis", summary: "Adaptive reuse with user interviews", scale: "30 interviews" },
  ],
  claims: [
    { skillId: "stakeholder_mgmt", label: "Coordinated 9 consultants on two towers", status: "demonstrated", evidence: "coordinated 9 consultants across structure, MEP, landscape and facade" },
    { skillId: "cross_functional_leadership", label: "Led design coordination for 360 units", status: "demonstrated", evidence: "Led design coordination for two G+22 residential towers (360 units total) for a Pune developer" },
    { skillId: "budget_management", label: "Delivered a Rs 1.2 crore fit-out 4% under budget", status: "demonstrated", evidence: "Owned the interior fit-out budget of Rs 1.2 crore for the sales gallery and show flats; delivered 4% under budget by re-tendering joinery." },
    { skillId: "negotiation", label: "Re-tendered joinery to cut cost", status: "inferred", evidence: "delivered 4% under budget by re-tendering joinery" },
    { skillId: "process_improvement", label: "Cut approval cycle from 3 weeks to 10 days", status: "demonstrated", evidence: "Built a drawing-revision tracker in Excel that cut the average approval cycle from 3 weeks to 10 days." },
    { skillId: "excel_modelling", label: "Builds tracking tools in Excel", status: "inferred", evidence: "Built a drawing-revision tracker in Excel" },
    { skillId: "client_communication", label: "Ran 12 design reviews with a developer's sales team", status: "demonstrated", evidence: "Ran 12 design-review workshops with the developer's sales and marketing team" },
    { skillId: "user_research", label: "Turned buyer feedback into a new unit mix", status: "inferred", evidence: "translated buyer feedback into a revised unit mix (more 2BHK, fewer 3BHK)" },
    { skillId: "user_research", label: "Interviewed 30 mill workers for thesis", status: "demonstrated", evidence: "with user interviews of 30 mill workers" },
    { skillId: "domain_real_estate", label: "Feasibility studies for 2 land parcels", status: "demonstrated", evidence: "Prepared massing and feasibility studies for 2 land parcels: FSI and TDR calculations, unit-mix options, rough construction cost per sq ft." },
    { skillId: "financial_analysis", label: "Estimated construction cost per sq ft", status: "inferred", evidence: "rough construction cost per sq ft" },
    { skillId: "regulatory_compliance", label: "Municipal approval sets for 3 projects", status: "demonstrated", evidence: "Produced working drawings and municipal approval sets for 3 commercial projects; handled PMC/MCGM submission queries." },
    { skillId: "presentation_storytelling", label: "Presents design options to clients", status: "demonstrated", evidence: "Presented design options to clients using SketchUp walkthroughs and rendered boards." },
    { skillId: "team_leadership", label: "Mentored 2 junior architects", status: "inferred", evidence: "Mentored 2 junior architects." },
  ],
} as const;

export const EXPLAIN: Record<string, { whyItFits: string; recruiterDoubt: string; firstProof: string }> = {
  "re-strategy": { whyItFits: "Your feasibility studies for 2 land parcels and the unit-mix change driven by buyer feedback are the core of development strategy work.", recruiterDoubt: "Whether you can build a cash-flow model, not just area and cost estimates.", firstProof: "Turn one of the two parcel studies into a full model with revenue, phasing and IRR." },
  "project-manager": { whyItFits: "Coordinating 9 consultants and delivering a Rs 1.2 crore fit-out under budget is project delivery with scale.", recruiterDoubt: "No formal project-controls vocabulary or certification yet.", firstProof: "A dossier of the tower coordination: plan, risk register and the approval-cycle fix." },
  "product-ops": { whyItFits: "The Excel tracker that cut approvals from 3 weeks to 10 days is a process-improvement case with a clear metric.", recruiterDoubt: "No exposure to software teams or SaaS tools.", firstProof: "Rebuild the tracker as a small no-code workflow with a before and after dashboard." },
  "strategy-ops": { whyItFits: "You already structure messy client problems into options, as the unit-mix revision shows.", recruiterDoubt: "Little evidence of independent analysis with data.", firstProof: "A teardown of an Indian proptech's growth with a sized opportunity." },
  "mgmt-consultant": { whyItFits: "Client workshops, structured feasibility work and stakeholder coordination map to consulting's day job.", recruiterDoubt: "Case-interview problem solving and financial analysis are unproven.", firstProof: "A market-entry case for a Pune developer built on your feasibility work." },
};

export const PLAN_CONSULTING = [
  { title: "Reframe your resume for consulting", detail: "Rewrite the top 6 bullets as problem, action and quantified result. Lead with the approval-cycle fix and the under-budget fit-out.", hours: 4, kind: "build", skillId: "written_communication", output: "Consulting-format resume" },
  { title: "Case fundamentals with free casebooks", detail: "Work through profitability, market sizing and market entry frameworks using IIM and ISB consulting club casebooks.", hours: 14, kind: "learn", skillId: "problem_structuring", output: "Notes on 12 solved cases" },
  { title: "Feasibility case, part 1: structure", detail: "Take one of your 2 land-parcel studies and frame it as a client question: should a Pune developer launch a 2BHK-led project here?", hours: 10, kind: "build", skillId: "problem_structuring", output: "Issue tree and hypothesis page" },
  { title: "Unit economics in a spreadsheet", detail: "Learn revenue, cost and IRR modelling on free material; apply it to the parcel with stated assumptions.", hours: 16, kind: "learn", skillId: "financial_analysis", output: "Working Excel model" },
  { title: "Feasibility case, part 2: recommendation", detail: "Write an 8-slide answer-first deck with the model's sensitivities.", hours: 12, kind: "build", skillId: "presentation_storytelling", output: "8-slide case deck" },
  { title: "Weekly case practice with peers", detail: "Six live cases with partners from LinkedIn or consulting-club communities.", hours: 9, kind: "network", skillId: "problem_structuring", output: "Case log with feedback" },
  { title: "Targeted outreach to real-estate advisory and strategy teams", detail: "15 warm messages to alumni at JLL, Knight Frank, CBRE and boutique strategy firms, with the deck attached.", hours: 8, kind: "apply", skillId: null, output: "Outreach tracker" },
];

export const DIAGNOSIS = {
  verdict: "One reply from 15 portal applications points to channel and positioning, not skills. Your resume still reads as an architect's, and portals screen on titles.",
  hypotheses: [
    { cause: "channel", confidence: "high", reasoning: "Job-portal applications for consulting are filtered on prior titles; referrals bypass that screen." },
    { cause: "positioning", confidence: "high", reasoning: "Your top bullets describe drawings and approvals rather than the client problems you solved." },
    { cause: "evidence_quality", confidence: "medium", reasoning: "The feasibility case is not yet public, so recruiters cannot see your analysis." },
  ],
  keepRoute: true,
  suggestedRoute: null,
  actions: [
    { title: "Rewrite the top 5 bullets as client outcomes", detail: "Lead with the 3 weeks to 10 days fix and the Rs 1.2 crore fit-out.", hours: 3, kind: "build", paid: false, output: "Revised resume" },
    { title: "Publish the feasibility case", detail: "Post the deck on LinkedIn with a short write-up of the decision it supports.", hours: 3, kind: "build", paid: false, output: "Public case post" },
    { title: "10 referral asks through alumni", detail: "Use your college and B-school alumni lists for real-estate advisory and strategy teams.", hours: 4, kind: "network", paid: false, output: "Referral tracker" },
  ],
};

export const BRIEF_CONSULTING = {
  title: "Should a Pune developer launch a 2BHK-led project on this parcel?",
  context: "Built on your feasibility study for one of the 2 land parcels and the unit-mix change you drove from buyer feedback.",
  task: "Answer the developer's go or no-go question with a sized market, a unit-economics model and a recommendation a CXO can act on.",
  deliverables: ["An 8-slide answer-first deck", "An Excel model with revenue, cost, phasing and IRR", "A one-page note on the three assumptions that matter most"],
  timeboxHours: 30,
  rubric: [
    { criterion: "Problem structuring", skillId: "problem_structuring", strong: "A clear issue tree; every slide answers one branch", developing: "Logical but not exhaustive", absent: "A narrative without structure" },
    { criterion: "Financial analysis", skillId: "financial_analysis", strong: "IRR and sensitivities with stated assumptions", developing: "Revenue and cost, no returns", absent: "Area and cost only" },
    { criterion: "Market research", skillId: "market_research", strong: "Absorption and pricing from named sources", developing: "Some data, unsourced", absent: "Opinion only" },
    { criterion: "Storytelling", skillId: "presentation_storytelling", strong: "Answer first, action titles", developing: "Findings first, answer late", absent: "No recommendation" },
  ],
};
