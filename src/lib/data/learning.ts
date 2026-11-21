// Learning and credential options. Every priced item carries a source and the date it was checked.
// Prices change: the UI always shows the source and date next to the number.

export const USD_INR_ASSUMPTION = 88; // planning assumption, shown in the UI

export type LearningOption = {
  id: string;
  name: string;
  provider: string;
  kind: "free" | "certificate" | "fellowship" | "exam" | "degree";
  costInr: number;
  hours: number; // total learner hours, planning estimate
  minHoursPerWeek: number; // pace the programme expects
  fullTime?: boolean;
  costNote: string;
  source: { label: string; url: string; checked: string; quality: "official" | "third-party" | "estimate" };
};

const CHECKED = "21 Nov 2026";

export const LEARNING: Record<string, LearningOption> = {
  google_ux: {
    id: "google_ux",
    name: "Google UX Design Certificate",
    provider: "Google on Coursera",
    kind: "certificate",
    costInr: 20 * USD_INR_ASSUMPTION * 6,
    hours: 200,
    minHoursPerWeek: 6,
    costNote: "USD 20 a month in India; 6 months assumed (Google says many finish in 3 to 6).",
    source: { label: "Grow with Google India", url: "https://grow.google/intl/en_in/certificates/", checked: CHECKED, quality: "official" },
  },
  google_pm: {
    id: "google_pm",
    name: "Google Project Management Certificate",
    provider: "Google on Coursera",
    kind: "certificate",
    costInr: 20 * USD_INR_ASSUMPTION * 5,
    hours: 140,
    minHoursPerWeek: 5,
    costNote: "USD 20 a month in India; 5 months assumed.",
    source: { label: "Grow with Google India", url: "https://grow.google/intl/en_in/certificates/", checked: CHECKED, quality: "official" },
  },
  google_da: {
    id: "google_da",
    name: "Google Data Analytics Certificate",
    provider: "Google on Coursera",
    kind: "certificate",
    costInr: 20 * USD_INR_ASSUMPTION * 6,
    hours: 240,
    minHoursPerWeek: 8,
    costNote: "USD 20 a month in India; Google lists 240 hours across 8 courses.",
    source: { label: "Google Data Analytics (India)", url: "https://grow.google/intl/en_in/data-analytics-course/", checked: CHECKED, quality: "official" },
  },
  nextleap_pm: {
    id: "nextleap_pm",
    name: "Product Manager Fellowship",
    provider: "NextLeap",
    kind: "fellowship",
    costInr: 27499,
    hours: 160,
    minHoursPerWeek: 10,
    costNote: "About Rs 27,499 per a third-party listing; 16 weeks at 10 hrs/week. Verify on NextLeap before paying.",
    source: { label: "Course Report listing", url: "https://www.coursereport.com/courses/product-manager-fellowship-nextleap", checked: CHECKED, quality: "third-party" },
  },
  nextleap_ux: {
    id: "nextleap_ux",
    name: "UI/UX Designer Fellowship",
    provider: "NextLeap",
    kind: "fellowship",
    costInr: 26999,
    hours: 120,
    minHoursPerWeek: 10,
    costNote: "About Rs 26,999 per a third-party listing; 12 weeks. Verify on NextLeap before paying.",
    source: { label: "Course Report school page", url: "https://coursereport-production.herokuapp.com/schools/nextleap/reviews?page=2", checked: CHECKED, quality: "third-party" },
  },
  nextleap_ba: {
    id: "nextleap_ba",
    name: "Business Analyst Fellowship",
    provider: "NextLeap",
    kind: "fellowship",
    costInr: 27499,
    hours: 140,
    minHoursPerWeek: 10,
    costNote: "Price not published in our sources; Rs 27,499 used as a planning estimate from sibling programmes.",
    source: { label: "NextLeap programmes", url: "https://nextleap.app/blog/tag/product/", checked: CHECKED, quality: "estimate" },
  },
  capm: {
    id: "capm",
    name: "CAPM exam (PMI)",
    provider: "Project Management Institute",
    kind: "exam",
    costInr: 23169 + 8000,
    hours: 70,
    minHoursPerWeek: 4,
    costNote: "Rs 23,169 non-member exam fee plus about Rs 8,000 prep material (estimate).",
    source: { label: "Coursera India: CAPM vs PMP", url: "https://www.coursera.org/in/articles/capm-vs-pmp", checked: CHECKED, quality: "third-party" },
  },
  pmp: {
    id: "pmp",
    name: "PMP exam (PMI)",
    provider: "Project Management Institute",
    kind: "exam",
    costInr: 55488 + 12000,
    hours: 120,
    minHoursPerWeek: 5,
    costNote: "Rs 55,488 non-member exam fee (PMI store, Sep 2026) plus prep. Needs 36 months leading projects.",
    source: { label: "Simpliaxis summary of PMI store prices", url: "https://www.simpliaxis.com/resources/pmi-certification-cost", checked: CHECKED, quality: "third-party" },
  },
  isb_pgp: {
    id: "isb_pgp",
    name: "One-year full-time MBA (ISB PGP as reference)",
    provider: "Indian School of Business",
    kind: "degree",
    costInr: 4046520,
    hours: 2400,
    minHoursPerWeek: 50,
    fullTime: true,
    costNote: "Rs 40,46,520 grand total, shared accommodation, 2027-28 single instalment. Excludes lost salary.",
    source: { label: "GMATPoint, citing ISB fee structure", url: "https://gmatpoint.com/isb-pgp-fees", checked: CHECKED, quality: "third-party" },
  },
  free_selfstudy: {
    id: "free_selfstudy",
    name: "Self-study with free material",
    provider: "Open resources",
    kind: "free",
    costInr: 0,
    hours: 0,
    minHoursPerWeek: 1,
    costNote: "Free tutorials, public casebooks, free tool tiers. Hours come from your skill gaps.",
    source: { label: "Bridgework planning rule", url: "/method", checked: CHECKED, quality: "estimate" },
  },
};
