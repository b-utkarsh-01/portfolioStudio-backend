export const defaultPortfolioData = {
  layout: {
    stages: [
      { id: "profile", title: "Profile", enabled: true },
      { id: "contact", title: "Contact", enabled: true },
      { id: "skills", title: "Skills", enabled: true },
      { id: "work", title: "Work & Education", enabled: true },
      { id: "social", title: "Services & Reviews", enabled: true },
      { id: "publish", title: "Publish", enabled: true },
    ],
  },
  customStages: [],
  profile: {
    name: "",
    title: [],
    summary: "",
    highlights: [],
    contacts: [],
  },
  badgeName: {
    name: "",
    logo: "",
    badgeTitle: "",
  },
  skills: {
    programming: [],
    frontend: [],
    backend: [],
    databases: [],
    api: [],
    cloud: [],
  },
  education: [],
  experiences: [],
  projects: [],
  services: [],
  testimonials: [],
  certifications: [],
};
