/**
 * Section → color/label mappings shared between the client (NeuralMap legend
 * + drawer) and the server (vault parser). Kept in its own file so the client
 * bundle doesn't pull in node:fs through vault-parser.
 */
export const SECTION_COLORS: Record<string, string> = {
  "01_Brand_Identity": "#f5d5d0",
  "02_Products/Jovee_AR": "#1a6b6b",
  "02_Products/Jovee_Link": "#9b8acc",
  "02_Products/Nail_Robot_Kiosk": "#e89545",
  "02_Products/Jovee_Nail_Polish": "#d96b8a",
  "03_Marketing": "#e8c145",
  "04_Legal_and_Patent": "#c84a4a",
  "05_Business_Docs": "#4a7ec8",
  "06_People_and_Team": "#5cc878",
  "07_Agents_and_Automation": "#dcdde1",
  "99_Meta": "#7a7a7a",
  root: "#7a7a7a",
};

export const SECTION_LABELS: Record<string, string> = {
  "01_Brand_Identity": "Brand",
  "02_Products/Jovee_AR": "Jovée AR",
  "02_Products/Jovee_Link": "Jovée Link",
  "02_Products/Nail_Robot_Kiosk": "Nail Robot Kiosk",
  "02_Products/Jovee_Nail_Polish": "Jovée Nail Polish",
  "03_Marketing": "Marketing",
  "04_Legal_and_Patent": "Legal & Patent",
  "05_Business_Docs": "Business Docs",
  "06_People_and_Team": "People & Team",
  "07_Agents_and_Automation": "Agents & Automation",
  "99_Meta": "Meta",
  root: "Root / Other",
};
