// Fictional demo personas. They are clearly labelled as sample profiles in the UI.
// The AI runs on them live; nothing about their analysis is pre-written.

export type Constraints = {
  hoursPerWeek: number;
  budgetInr: number;
  currentCtcLpa: number;
  incomeFloorMonthly: number;
  fullTimeStudyOk: boolean;
  canRelocate: boolean;
  maxPayCutPct: number;
};

export const DEFAULT_CONSTRAINTS: Constraints = {
  hoursPerWeek: 8,
  budgetInr: 50000,
  currentCtcLpa: 8,
  incomeFloorMonthly: 50000,
  fullTimeStudyOk: false,
  canRelocate: false,
  maxPayCutPct: 10,
};

export type Persona = {
  id: string;
  name: string;
  headline: string;
  city: string;
  target: string;
  constraints: Constraints;
  resume: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "architect",
    name: "Rohan Deshpande",
    headline: "Project architect, 4 years",
    city: "Pune",
    target: "Consulting or product roles, without quitting my job",
    constraints: { hoursPerWeek: 8, budgetInr: 60000, currentCtcLpa: 9, incomeFloorMonthly: 60000, fullTimeStudyOk: false, canRelocate: false, maxPayCutPct: 10 },
    resume: `ROHAN DESHPANDE
Pune | Sample profile for demonstration

PROJECT ARCHITECT, Studio Arkaya (mid-size firm, 35 people), Pune | Jul 2023 to present
- Led design coordination for two G+22 residential towers (360 units total) for a Pune developer; coordinated 9 consultants across structure, MEP, landscape and facade.
- Owned the interior fit-out budget of Rs 1.2 crore for the sales gallery and show flats; delivered 4% under budget by re-tendering joinery.
- Ran 12 design-review workshops with the developer's sales and marketing team; translated buyer feedback into a revised unit mix (more 2BHK, fewer 3BHK).
- Built a drawing-revision tracker in Excel that cut the average approval cycle from 3 weeks to 10 days.
- Prepared massing and feasibility studies for 2 land parcels: FSI and TDR calculations, unit-mix options, rough construction cost per sq ft.
- Mentored 2 junior architects.

JUNIOR ARCHITECT, Mehta & Associates, Mumbai | Jul 2022 to Jun 2023
- Produced working drawings and municipal approval sets for 3 commercial projects; handled PMC/MCGM submission queries.
- Presented design options to clients using SketchUp walkthroughs and rendered boards.

EDUCATION
B.Arch, Savitribai Phule Pune University, 2022. Thesis: adaptive reuse of a textile mill, with user interviews of 30 mill workers.

TOOLS: AutoCAD, Revit, SketchUp, Lumion, Excel, PowerPoint, basic Figma.`,
  },
  {
    id: "hr",
    name: "Sneha Iyer",
    headline: "Talent acquisition, 3 years",
    city: "Bengaluru",
    target: "Data or people analytics",
    constraints: { hoursPerWeek: 10, budgetInr: 40000, currentCtcLpa: 7, incomeFloorMonthly: 45000, fullTimeStudyOk: false, canRelocate: true, maxPayCutPct: 5 },
    resume: `SNEHA IYER
Bengaluru | Sample profile for demonstration

TALENT ACQUISITION SPECIALIST, a 1,200-person IT services firm | 2023 to present
- Hire 60 to 80 engineers a year across 3 business units; manage relationships with 5 recruitment agencies.
- Built the team's weekly hiring-funnel report in Excel (pivot tables, VLOOKUP) used by the HR head; spotted that agency hires had 2x early attrition, which changed the agency mix.
- Ran a candidate-experience survey (420 responses) and presented the findings to leadership.
- Coordinate interview panels with 25 hiring managers.

HR EXECUTIVE, a staffing company | 2022 to 2023
- Onboarding and payroll inputs for 300 contract staff.

EDUCATION
BBA, Christ University, 2022.

TOOLS: Excel, Zoho Recruit, Google Sheets, basic SQL (self-taught, no project yet).`,
  },
  {
    id: "finance",
    name: "Arjun Mehta",
    headline: "Equity research analyst, 5 years",
    city: "Mumbai",
    target: "Product management at a fintech",
    constraints: { hoursPerWeek: 6, budgetInr: 100000, currentCtcLpa: 16, incomeFloorMonthly: 110000, fullTimeStudyOk: false, canRelocate: false, maxPayCutPct: 10 },
    resume: `ARJUN MEHTA
Mumbai | Sample profile for demonstration

EQUITY RESEARCH ANALYST (Consumer and fintech), a domestic brokerage | 2022 to present
- Cover 14 listed companies including 4 fintech and payments businesses; publish quarterly earnings notes and initiation reports.
- Built bottom-up revenue models from app downloads, take rates and cohort data for 2 listed fintechs.
- Interviewed 40+ merchants and users as channel checks for a payments coverage report.
- Present stock ideas to fund managers; 3 calls cited in business media.

ASSOCIATE, a Big 4 transaction advisory team | 2020 to 2022
- Financial due diligence on 6 mid-market deals; working capital and quality of earnings analysis.

EDUCATION
B.Com, Narsee Monjee College, 2020. CFA Level II cleared.

TOOLS: Excel (advanced), Bloomberg, PowerPoint, basic Python (pandas) for data pulls.`,
  },
];
