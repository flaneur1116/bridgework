// Canonical capability taxonomy. Small and curated on purpose: the AI maps
// resume evidence onto these ids so that scoring can be done by code, not by the model.

export type SkillId =
  | "stakeholder_mgmt"
  | "client_communication"
  | "user_research"
  | "requirements_gathering"
  | "problem_structuring"
  | "hypothesis_testing"
  | "data_analysis"
  | "excel_modelling"
  | "financial_analysis"
  | "market_research"
  | "presentation_storytelling"
  | "written_communication"
  | "visual_design"
  | "prototyping"
  | "design_iteration"
  | "usability_testing"
  | "systems_thinking"
  | "project_planning"
  | "budget_management"
  | "vendor_coordination"
  | "risk_management"
  | "cross_functional_leadership"
  | "team_leadership"
  | "process_improvement"
  | "sql"
  | "python"
  | "dashboards_bi"
  | "statistics"
  | "product_metrics"
  | "prioritisation"
  | "agile_delivery"
  | "technical_fluency"
  | "negotiation"
  | "strategy_frameworks"
  | "domain_real_estate"
  | "domain_finance"
  | "domain_people"
  | "regulatory_compliance";

export const SKILLS: Record<SkillId, { label: string; group: string }> = {
  stakeholder_mgmt: { label: "Stakeholder management", group: "People" },
  client_communication: { label: "Client communication", group: "People" },
  cross_functional_leadership: { label: "Cross-functional coordination", group: "People" },
  team_leadership: { label: "Team leadership and mentoring", group: "People" },
  negotiation: { label: "Negotiation", group: "People" },
  user_research: { label: "User research and interviews", group: "Discovery" },
  requirements_gathering: { label: "Requirements gathering", group: "Discovery" },
  market_research: { label: "Market and competitor research", group: "Discovery" },
  problem_structuring: { label: "Problem structuring", group: "Thinking" },
  hypothesis_testing: { label: "Hypothesis-driven analysis", group: "Thinking" },
  systems_thinking: { label: "Systems thinking", group: "Thinking" },
  strategy_frameworks: { label: "Business strategy frameworks", group: "Thinking" },
  data_analysis: { label: "Data analysis", group: "Analysis" },
  excel_modelling: { label: "Spreadsheet modelling", group: "Analysis" },
  financial_analysis: { label: "Financial analysis and unit economics", group: "Analysis" },
  statistics: { label: "Statistics", group: "Analysis" },
  sql: { label: "SQL", group: "Tools" },
  python: { label: "Python", group: "Tools" },
  dashboards_bi: { label: "Dashboards and BI tools", group: "Tools" },
  technical_fluency: { label: "Software and tech fluency", group: "Tools" },
  presentation_storytelling: { label: "Presentation and storytelling", group: "Communication" },
  written_communication: { label: "Structured writing", group: "Communication" },
  visual_design: { label: "Visual communication", group: "Design" },
  prototyping: { label: "Prototyping and wireframing", group: "Design" },
  design_iteration: { label: "Design iteration under constraints", group: "Design" },
  usability_testing: { label: "Usability testing", group: "Design" },
  project_planning: { label: "Project planning and scheduling", group: "Delivery" },
  budget_management: { label: "Budget ownership", group: "Delivery" },
  vendor_coordination: { label: "Vendor and consultant coordination", group: "Delivery" },
  risk_management: { label: "Risk management", group: "Delivery" },
  process_improvement: { label: "Process improvement", group: "Delivery" },
  agile_delivery: { label: "Agile and software delivery", group: "Delivery" },
  product_metrics: { label: "Product metrics", group: "Product" },
  prioritisation: { label: "Prioritisation and trade-offs", group: "Product" },
  domain_real_estate: { label: "Real estate and construction domain", group: "Domain" },
  domain_finance: { label: "Financial services domain", group: "Domain" },
  domain_people: { label: "HR and people domain", group: "Domain" },
  regulatory_compliance: { label: "Regulatory and code compliance", group: "Domain" },
};

export const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

export function skillLabel(id: string) {
  return (SKILLS as Record<string, { label: string }>)[id]?.label ?? id;
}
