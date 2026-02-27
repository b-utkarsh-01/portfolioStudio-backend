export const defaultPortfolioData = {
  profile: {
    name: "Your Name",
    title: ["Full Stack Developer", "Backend Engineer"],
    summary: "Add your profile summary here.",
    highlights: ["Node.js", "Express.js", "MongoDB"],
    contacts: [
      { type: "phone", text: "+91 0000000000", href: "tel:+910000000000" },
      { type: "email", text: "you@example.com", href: "mailto:you@example.com" },
      {
        type: "github",
        text: "github.com/your-username",
        href: "https://github.com/your-username",
        external: true,
      },
    ],
  },
  badgeName: {
    name: "Your Name",
    logo: "YN",
    badgeTitle: "Portfolio Builder User",
  },
  skills: {
    programming: ["JavaScript", "Python"],
    frontend: ["React.js", "Tailwind CSS"],
    backend: ["Node.js", "Express.js"],
    databases: ["MongoDB"],
    api: ["REST APIs"],
    cloud: ["Docker", "AWS"],
  },
  education: [
    {
      subtitle: "Expected Graduation: 2026",
      items: [
        {
          institute: "Your University",
          degree: "Bachelor of Technology, Computer Science",
        },
      ],
    },
  ],
  experiences: [],
  projects: [],
  certifications: [],
};
