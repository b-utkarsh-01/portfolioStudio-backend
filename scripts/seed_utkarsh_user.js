import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Portfolio from "../src/models/Portfolio.js";

const MONGO_URI =
  "mongodb+srv://utpathak76_db_user:BkI8dg9RZT9AGPlv@cluster0.hzphtga.mongodb.net/NewStudio?retryWrites=true&w=majority";

const username = "utkarsh";
const rawPassword = "test1234";
const email = "utpathak76@gmail.com";
const displayName = "Utkarsh Pathak";

const fullPortfolioData = {
  layout: {
    stages: [
      { id: "profile", title: "Profile", enabled: true },
      { id: "contact", title: "Contact", enabled: true },
      { id: "skills", title: "Technical Skills", enabled: true },
      { id: "work", title: "Experience & Projects", enabled: true },
      { id: "social", title: "Services & Testimonials", enabled: true },
      { id: "publish", title: "Certifications", enabled: true },
      { id: "custom-achievements", title: "Honors & Achievements", enabled: true },
      { id: "custom-opensource", title: "Open Source Initiatives", enabled: true },
      { id: "custom-interests", title: "Hobbies & Side Quests", enabled: false }, // Removed/hidden stage to demonstrate restore feature
    ],
  },
  customStages: [
    {
      id: "custom-achievements",
      title: "Honors & Achievements",
      kind: "cards",
      paragraph: "",
      cards: [
        {
          title: "National Hackathon Winner",
          subtitle: "1st Place · Ministry of Education & AICTE",
          description: "Engineered an AI-powered automated civic grievance routing platform handling multilingual user reports across 15+ civic departments.",
          link: "https://github.com/utpathak76",
          image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
        },
        {
          title: "Top Open Source Maintainer",
          subtitle: "Global Dev Community Recognition",
          description: "Maintained developer CLI utilities and web toolkits downloaded over 100,000+ times by developers across 40+ countries.",
          link: "https://github.com/utpathak76",
          image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60",
        },
      ],
    },
    {
      id: "custom-opensource",
      title: "Open Source Initiatives",
      kind: "paragraph",
      paragraph:
        "I am an active advocate for the open web and open-source software. Beyond building commercial software, I regularly contribute to widely-used JavaScript/TypeScript and Python tools, mentor aspiring engineers through code reviews, and publish technical deep-dives on distributed system design, clean architecture, and modern web performance.",
      cards: [],
    },
    {
      id: "custom-interests",
      title: "Hobbies & Side Quests",
      kind: "cards",
      paragraph: "",
      cards: [
        {
          title: "Astrophotography & Astronomy",
          subtitle: "Deep Sky Exploration",
          description: "Tracking planetary motion and imaging deep sky nebulae using automated telescope mounts and stacking algorithms.",
          link: "https://github.com/utpathak76",
          image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=60",
        },
        {
          title: "Technical Writing & Tech Talks",
          subtitle: "Community Mentorship",
          description: "Authoring deep-dive articles on microservices, caching, and developer experience read by over 50,000 developers.",
          link: "https://github.com/utpathak76",
          image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60",
        },
      ],
    },
  ],
  profile: {
    name: displayName,
    title: [
      "Senior Full Stack Engineer",
      "Cloud & Distributed Systems Architect",
      "AI & LLM Solutions Specialist",
      "Open Source Maintainer",
    ],
    summary:
      "Results-driven Senior Full Stack Software Engineer with deep expertise in architecting resilient web applications, distributed microservices, and AI-powered platforms. Passionate about clean modular code, sub-second latency, and delightful user experiences.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    highlights: [
      "5+ Years Industry Experience",
      "40+ Projects Successfully Shipped",
      "99.99% Uptime Cloud Architecture",
      "Top-tier Open Source Contributor",
    ],
    contacts: [
      { type: "email", text: email, href: `mailto:${email}`, external: false },
      { type: "phone", text: "+91 98765 43210", href: "tel:+919876543210", external: false },
      { type: "github", text: "github.com/utpathak76", href: "https://github.com/utpathak76", external: true },
      { type: "linkedin", text: "linkedin.com/in/utkarsh-pathak", href: "https://linkedin.com/in/utkarsh-pathak", external: true },
      { type: "website", text: "utkarshpathak.dev", href: "https://utkarshpathak.dev", external: true },
    ],
  },
  badgeName: {
    name: "Utkarsh",
    logo: "UP",
    badgeTitle: "Senior Full Stack Engineer",
  },
  skills: {
    programming: ["JavaScript", "TypeScript", "Python", "C++", "Go", "SQL"],
    frontend: ["React", "Next.js", "Vue.js", "Tailwind CSS", "Redux Toolkit", "Three.js", "HTML5", "CSS3"],
    backend: ["Node.js", "Express.js", "Fastify", "NestJS", "GraphQL", "REST APIs"],
    databases: ["MongoDB", "PostgreSQL", "Redis", "MySQL", "DynamoDB"],
    api: ["RESTful APIs", "GraphQL", "WebSockets", "gRPC", "Webhooks"],
    cloud: ["AWS", "Google Cloud", "Docker", "Kubernetes", "CI/CD Pipelines", "Vercel"],
    // Additional Custom Skill Groups
    "DevOps & Infrastructure": ["Docker Compose", "GitHub Actions", "Linux / Bash", "Nginx", "Terraform", "Monitoring (Prometheus/Grafana)"],
    "AI & Intelligent Systems": ["OpenAI API", "LangChain", "Vector Databases", "Prompt Engineering", "Pandas", "Scikit-Learn"],
  },
  education: [
    {
      subtitle: "2019 - 2023",
      items: [
        {
          institute: "National Institute of Technology",
          degree: "B.Tech in Computer Science & Engineering (First Class with Distinction)",
        },
      ],
    },
    {
      subtitle: "2017 - 2019",
      items: [
        {
          institute: "Delhi Public School",
          degree: "Senior Secondary (Class XII, Physics, Chemistry, Mathematics)",
        },
      ],
    },
  ],
  experiences: [
    {
      title: "Senior Full Stack Engineer",
      company: "Tech Innovators Lab",
      period: "2023 - Present",
      description:
        "Architecting distributed microservices and reactive single-page applications. Reduced system API latency by 45% using Redis caching layers and optimized MongoDB pipelines. Mentoring a squad of 6 engineers.",
    },
    {
      title: "Software Engineer",
      company: "NextGen Software Solutions",
      period: "2021 - 2023",
      description:
        "Spearheaded backend development for real-time collaboration tools using Node.js, WebSockets, and MongoDB. Integrated secure role-based access control and token-based session management.",
    },
    {
      title: "Frontend Developer",
      company: "WebCraft Studio",
      period: "2020 - 2021",
      description:
        "Crafted mobile-first, high-performance UI components using React and Tailwind CSS. Improved Core Web Vitals score from 68 to 96 across core marketing pages.",
    },
  ],
  projects: [
    {
      name: "PortfolioStudio Platform",
      tech: "React, Node.js, Express, MongoDB, Tailwind CSS",
      description:
        "A next-generation portfolio building platform featuring live multi-theme previews, AI studio customization, custom domain routing, and modular stage toggling.",
      link: "https://github.com/utpathak76/portfolio-studio",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    },
    {
      name: "AI Code Reviewer & Assistant",
      tech: "TypeScript, OpenAI API, LangChain, Node.js",
      description:
        "Automated GitHub pull request reviewer utilizing LLM analysis and AST AST-based verification to pinpoint security vulnerabilities and code smells.",
      link: "https://github.com/utpathak76/ai-code-reviewer",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    },
    {
      name: "Realtime Collab Canvas",
      tech: "React, WebSockets, Redis, Canvas API",
      description:
        "High-performance collaborative whiteboarding canvas supporting low-latency concurrent edits, state snapshotting, and vector export.",
      link: "https://github.com/utpathak76/collab-canvas",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
    },
    {
      name: "Cloud Infrastructure Observability",
      tech: "Go, Docker, Prometheus, Grafana, AWS",
      description:
        "Distributed monitoring suite providing real-time telemetry, automated anomaly alerts, and container health metrics dashboards.",
      link: "https://github.com/utpathak76/cloud-monitor",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    },
  ],
  services: [
    {
      name: "Full-Stack Web Development",
      description:
        "End-to-end design, implementation, and deployment of modern, scalable web applications with high test coverage and clean architecture.",
    },
    {
      name: "Cloud Architecture & DevOps",
      description:
        "Automated CI/CD pipelines, Docker containerization, Kubernetes clustering, and cost-efficient cloud infrastructure setup on AWS/GCP.",
    },
    {
      name: "AI & LLM Application Engineering",
      description:
        "Integration of intelligent generative AI capabilities, semantic search, vector embeddings, and RAG architectures into production workflows.",
    },
    {
      name: "API Design & Performance Tuning",
      description:
        "High-throughput RESTful, GraphQL, and WebSocket API engineering with smart caching, query optimization, and rate limiting.",
    },
  ],
  testimonials: [
    {
      name: "Alex Morgan",
      role: "CTO, CloudScale Labs",
      quote:
        "Utkarsh is an exceptional engineer. He took our core services from prototype to a resilient, production-ready cloud platform. His speed and engineering rigor are unmatched.",
    },
    {
      name: "Sarah Jenkins",
      role: "Lead Product Manager",
      quote:
        "Working alongside Utkarsh was effortless. He has an uncommon ability to grasp nuanced business requirements and translate them into intuitive, blazing-fast interfaces.",
    },
    {
      name: "David Chen",
      role: "Engineering Director",
      quote:
        "Utkarsh consistently raises the technical bar across the team. His architectural decisions are clean, pragmatic, and built to scale effortlessly.",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect - Associate",
      provider: "Amazon Web Services (AWS)",
      link: "https://aws.amazon.com/certification/",
    },
    {
      name: "MongoDB Certified Developer Associate",
      provider: "MongoDB Inc.",
      link: "https://learn.mongodb.com/",
    },
    {
      name: "Meta Certified Frontend Developer",
      provider: "Meta / Coursera",
      link: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    },
  ],
};

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully to DB:", mongoose.connection.name);

  // 1. Hash password
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 2. Upsert User
  let user = await User.findOne({ username });
  if (user) {
    console.log(`User "${username}" already exists. Updating...`);
    user.email = email;
    user.displayName = displayName;
    user.passwordHash = passwordHash;
    user.hasPremiumAccess = true;
    await user.save();
  } else {
    console.log(`Creating user "${username}"...`);
    user = await User.create({
      username,
      email,
      displayName,
      passwordHash,
      hasPremiumAccess: true,
      refreshTokens: [],
    });
  }
  console.log("User ready:", { id: user._id.toString(), username: user.username, email: user.email, hasPremiumAccess: user.hasPremiumAccess });

  // 3. Upsert Portfolio
  let portfolio = await Portfolio.findOne({ user: user._id });
  if (portfolio) {
    console.log(`Updating portfolio for user "${username}"...`);
    portfolio.username = username;
    portfolio.templateId = "premium-v1";
    portfolio.status = "published";
    portfolio.visibility = "public";
    portfolio.slug = username;
    portfolio.publishedAt = new Date();
    portfolio.data = fullPortfolioData;
    await portfolio.save();
  } else {
    console.log(`Creating portfolio for user "${username}"...`);
    portfolio = await Portfolio.create({
      user: user._id,
      username,
      templateId: "premium-v1",
      status: "published",
      visibility: "public",
      slug: username,
      publishedAt: new Date(),
      data: fullPortfolioData,
    });
  }

  console.log("Portfolio ready:", {
    id: portfolio._id.toString(),
    username: portfolio.username,
    status: portfolio.status,
    visibility: portfolio.visibility,
    slug: portfolio.slug,
    templateId: portfolio.templateId,
    stagesCount: portfolio.data.layout.stages.length,
    customStagesCount: portfolio.data.customStages.length,
  });

  await mongoose.disconnect();
  console.log("Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
