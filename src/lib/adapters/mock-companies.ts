import { CompanyProvider, CompanyIntel } from "@/lib/types";

const COMPANY_INTEL_DB: Record<string, CompanyIntel> = {
  "Check Point Software": {
    name: "Check Point Software",
    sector: "Cybersecurity",
    size: "5,001-10,000",
    hq: "Tel Aviv, Israel",
    description:
      "A global leader in cybersecurity solutions, providing hardware and software products for IT security including network security, endpoint security, cloud security, mobile security, data security, and security management.",
    linkedinUrl: "https://www.linkedin.com/company/check-point-software-technologies",
    website: "https://www.checkpoint.com",
    isTarget: true,
    hiringSignals: [
      "Expanding SASE and cloud security GTM teams",
      "Recently launched Infinity Platform - ramping BD and partnerships",
      "Opened 15+ new sales roles in Israel in the past quarter",
    ],
  },
  CyberArk: {
    name: "CyberArk",
    sector: "Identity & Access Management",
    size: "1,001-5,000",
    hq: "Petah Tikva, Israel",
    description:
      "The global leader in Identity Security and privileged access management. CyberArk provides the most comprehensive security offering for any identity – human or machine – across business applications, distributed workforces, hybrid cloud environments, and throughout the DevOps lifecycle.",
    linkedinUrl: "https://www.linkedin.com/company/cyberark",
    website: "https://www.cyberark.com",
    isTarget: true,
    hiringSignals: [
      "Acquired Venafi - expanding machine identity portfolio",
      "Growing channel and alliances team in Israel",
      "Opening new BD positions for identity security platform",
    ],
  },
  Wiz: {
    name: "Wiz",
    sector: "Cloud Security",
    size: "1,001-5,000",
    hq: "Tel Aviv, Israel",
    description:
      "The leading cloud security platform that enables organizations to secure everything they build and run in the cloud. Wiz connects in minutes via API to scan the full cloud environment and provides a unified view of risk across cloud resources, workloads, and data.",
    linkedinUrl: "https://www.linkedin.com/company/wizsecurity",
    website: "https://www.wiz.io",
    isTarget: true,
    hiringSignals: [
      "Hyper-growth stage - hiring aggressively across all GTM functions",
      "Expanding enterprise sales teams in Israel and globally",
      "Raising new funding round - accelerating market expansion",
    ],
  },
  "Orca Security": {
    name: "Orca Security",
    sector: "Cloud Security",
    size: "501-1,000",
    hq: "Tel Aviv, Israel",
    description:
      "Agentless cloud security platform that provides instant-on, workload-deep security for AWS, Azure, and GCP. Orca detects vulnerabilities, malware, misconfigurations, lateral movement risk, and insecure sensitive data across cloud environments.",
    linkedinUrl: "https://www.linkedin.com/company/orca-security",
    website: "https://orca.security",
    isTarget: true,
    hiringSignals: [
      "Expanding partner ecosystem with MSSPs and VARs",
      "Growing enterprise sales team for large account acquisition",
    ],
  },
  Armis: {
    name: "Armis",
    sector: "Cybersecurity",
    size: "501-1,000",
    hq: "Tel Aviv, Israel",
    description:
      "The leading asset intelligence platform for the new attack surface. Armis provides a unified asset intelligence platform designed to address the new threat landscape that connected devices create across enterprises, healthcare, manufacturing, and critical infrastructure.",
    linkedinUrl: "https://www.linkedin.com/company/armabortsecurity",
    website: "https://www.armis.com",
    isTarget: true,
    hiringSignals: [
      "Expanding into OT/ICS security market",
      "Hiring BD roles focused on healthcare and critical infrastructure verticals",
    ],
  },
  SentinelOne: {
    name: "SentinelOne",
    sector: "Endpoint Security",
    size: "1,001-5,000",
    hq: "Tel Aviv, Israel",
    description:
      "An autonomous cybersecurity platform company. SentinelOne's Singularity XDR platform delivers AI-powered prevention, detection, response, and threat hunting across endpoints, cloud workloads, containers, and IoT devices.",
    linkedinUrl: "https://www.linkedin.com/company/sentinelone",
    website: "https://www.sentinelone.com",
    isTarget: true,
    hiringSignals: [
      "Expanding channel partner program across EMEA",
      "Hiring sales engineers and pre-sales consultants in Israel",
      "Growing strategic accounts team",
    ],
  },
  Varonis: {
    name: "Varonis",
    sector: "Data Security",
    size: "1,001-5,000",
    hq: "Herzliya, Israel",
    description:
      "Varonis is a pioneer in data security and analytics, specializing in software for data protection, threat detection and response, and compliance. Varonis protects enterprise data by analyzing data activity and user behavior to detect threats and automate data protection.",
    linkedinUrl: "https://www.linkedin.com/company/varonis",
    website: "https://www.varonis.com",
    isTarget: true,
    hiringSignals: [
      "Transitioning to SaaS model - hiring cloud sales specialists",
      "Expanding mid-market sales team in Israel",
    ],
  },
  Claroty: {
    name: "Claroty",
    sector: "OT/ICS Security",
    size: "501-1,000",
    hq: "Tel Aviv, Israel",
    description:
      "Claroty empowers organizations to secure cyber-physical systems across industrial (OT/ICS), healthcare (IoMT), and enterprise (IoT) environments. The Claroty Platform provides full-stack visibility, risk and vulnerability management, threat detection, and secure remote access.",
    linkedinUrl: "https://www.linkedin.com/company/claroty",
    website: "https://www.claroty.com",
    isTarget: true,
    hiringSignals: [
      "Growing channel partnerships with industrial automation vendors",
      "Expanding BD efforts in defense and critical infrastructure",
    ],
  },
  Pentera: {
    name: "Pentera",
    sector: "Cybersecurity",
    size: "201-500",
    hq: "Tel Aviv, Israel",
    description:
      "Pentera is the leader in Automated Security Validation, allowing organizations to test the integrity of all cybersecurity layers by safely emulating real-world attacks at scale. Pentera's platform continuously validates security controls and exposes exploitable gaps.",
    linkedinUrl: "https://www.linkedin.com/company/penabortra",
    website: "https://www.pentera.io",
    isTarget: true,
    hiringSignals: [
      "Scaling sales team after Series C funding",
      "Hiring channel managers for EMEA expansion",
    ],
  },
  "XM Cyber": {
    name: "XM Cyber",
    sector: "Cybersecurity",
    size: "201-500",
    hq: "Herzliya, Israel",
    description:
      "XM Cyber is a leader in hybrid cloud security, using attack path management to continuously expose and remediate attack paths across on-prem and cloud environments. Founded by top executives from the Israeli intelligence community.",
    linkedinUrl: "https://www.linkedin.com/company/xm-cyber",
    website: "https://www.xmcyber.com",
    isTarget: true,
    hiringSignals: [
      "Acquired by Schwarz Group - expanding globally",
      "Hiring BD and partnership managers in Israel",
    ],
  },
  "Cato Networks": {
    name: "Cato Networks",
    sector: "Network Security",
    size: "501-1,000",
    hq: "Tel Aviv, Israel",
    description:
      "Cato Networks provides the world's first SASE platform, converging SD-WAN and network security into a global cloud service. Cato enables organizations to connect and secure all users, locations, and applications through a single cloud-native platform.",
    linkedinUrl: "https://www.linkedin.com/company/cato-networks",
    website: "https://www.catonetworks.com",
    isTarget: true,
    hiringSignals: [
      "Rapid growth - hiring across all GTM functions",
      "Expanding enterprise sales team for SASE platform",
    ],
  },
  Axonius: {
    name: "Axonius",
    sector: "Cybersecurity",
    size: "501-1,000",
    hq: "Tel Aviv, Israel",
    description:
      "Axonius is the leader in cybersecurity asset management, providing a comprehensive inventory of all assets and delivering actionable insights to remediate threats, reduce risk, and automate response. Used by Fortune 500 companies and government agencies.",
    linkedinUrl: "https://www.linkedin.com/company/axonius",
    website: "https://www.axonius.com",
    isTarget: true,
    hiringSignals: [
      "Growing federal and government sales team",
      "Expanding partnerships with SIEM and SOAR vendors",
    ],
  },
  Silverfort: {
    name: "Silverfort",
    sector: "Identity & Access Management",
    size: "201-500",
    hq: "Tel Aviv, Israel",
    description:
      "Silverfort delivers unified identity protection across all users, resources, and environments. The platform provides real-time MFA, identity threat detection, and zero-trust policies without agents or proxies.",
    linkedinUrl: "https://www.linkedin.com/company/silverfort",
    website: "https://www.silverfort.com",
    isTarget: true,
    hiringSignals: [
      "Post Series D - scaling GTM aggressively",
      "Hiring BD and channel managers for IAM market expansion",
    ],
  },
  "Elbit Systems": {
    name: "Elbit Systems",
    sector: "Defense Technology",
    size: "10,001+",
    hq: "Haifa, Israel",
    description:
      "Elbit Systems is an international high technology company engaged in a wide range of defense, homeland security, and commercial programs. The company develops and supplies advanced defense electronics, electro-optic, and space systems, UAVs, and cyber solutions.",
    linkedinUrl: "https://www.linkedin.com/company/elbit-systems",
    website: "https://elbitsystems.com",
    isTarget: true,
    hiringSignals: [
      "Expanding cyber division BD team",
      "Growing international defense sales organization",
      "Investing in dual-use technology commercialization",
    ],
  },
  "Rafael Advanced Defense Systems": {
    name: "Rafael Advanced Defense Systems",
    sector: "Defense Technology",
    size: "10,001+",
    hq: "Haifa, Israel",
    description:
      "Rafael Advanced Defense Systems is one of Israel's largest defense companies, developing and manufacturing advanced defense systems for the IDF and allied militaries worldwide. Products include air defense, precision weapons, C4ISR, and cyber solutions.",
    linkedinUrl: "https://www.linkedin.com/company/rafael-advanced-defense-systems-ltd-",
    website: "https://www.rafael.co.il",
    isTarget: true,
    hiringSignals: [
      "Growing commercial cyber BD team",
      "Expanding international sales for Iron Dome and David's Sling programs",
      "Recruiting for new dual-use tech ventures",
    ],
  },
  "Israel Aerospace Industries": {
    name: "Israel Aerospace Industries",
    sector: "Defense Technology",
    size: "10,001+",
    hq: "Lod, Israel",
    description:
      "Israel Aerospace Industries (IAI) is Israel's largest aerospace and defense company, specializing in aerial, space, land, naval, and cyber systems. IAI provides advanced technology solutions for defense and commercial markets globally.",
    linkedinUrl: "https://www.linkedin.com/company/israel-aerospace-industries",
    website: "https://www.iai.co.il",
    isTarget: true,
    hiringSignals: [
      "Expanding BD team for satellite and space programs",
      "Growing cyber defense commercial division",
    ],
  },
  Palantir: {
    name: "Palantir",
    sector: "Defense Technology",
    size: "5,001-10,000",
    hq: "Denver, CO (Israel office: Tel Aviv)",
    description:
      "Palantir Technologies builds software platforms for organizations to integrate, manage, and analyze data at scale. Products include Gotham (defense/intelligence), Foundry (commercial), and AIP (AI/ML platform). Growing presence in Israel.",
    linkedinUrl: "https://www.linkedin.com/company/palantir-technologies",
    website: "https://www.palantir.com",
    isTarget: true,
    hiringSignals: [
      "Expanding Israel operations",
      "Hiring BD roles for defense and intelligence customers",
    ],
  },
  Anduril: {
    name: "Anduril",
    sector: "Defense Technology",
    size: "1,001-5,000",
    hq: "Costa Mesa, CA (exploring Israel presence)",
    description:
      "Anduril Industries builds advanced defense capabilities powered by AI and autonomous systems. Products include Lattice (AI command and control), Ghost (autonomous UAV), Sentry Tower, and Dive-LD (autonomous underwater vehicle).",
    linkedinUrl: "https://www.linkedin.com/company/anduril",
    website: "https://www.anduril.com",
    isTarget: true,
    hiringSignals: [
      "Exploring Israel market entry with BD hires",
      "Growing partnerships with allied defense companies",
    ],
  },
  Snyk: {
    name: "Snyk",
    sector: "Application Security",
    size: "1,001-5,000",
    hq: "Tel Aviv, Israel / Boston, MA",
    description:
      "Snyk is the leader in developer security, providing tools to find, fix, and monitor vulnerabilities in open source dependencies, container images, infrastructure as code, and custom code. Used by millions of developers worldwide.",
    linkedinUrl: "https://www.linkedin.com/company/snyk",
    website: "https://snyk.io",
    isTarget: true,
    hiringSignals: [
      "Growing enterprise sales team in Israel",
      "Expanding channel partnerships globally",
    ],
  },
  Sygnia: {
    name: "Sygnia",
    sector: "Cybersecurity",
    size: "201-500",
    hq: "Tel Aviv, Israel",
    description:
      "Sygnia is a cyber technology and services company, providing high-end consulting and incident response support for organizations worldwide. Founded by veterans of Israel's Unit 8200, Sygnia specializes in advanced threat hunting and response.",
    linkedinUrl: "https://www.linkedin.com/company/sygnia",
    website: "https://www.sygnia.co",
    isTarget: true,
    hiringSignals: [
      "Expanding BD team for managed detection and response services",
      "Growing enterprise accounts in financial services vertical",
    ],
  },
};

export const mockCompanyProvider: CompanyProvider = {
  async getCompanyIntel(companyName: string): Promise<CompanyIntel | null> {
    // Try exact match first
    if (COMPANY_INTEL_DB[companyName]) {
      return COMPANY_INTEL_DB[companyName];
    }

    // Try case-insensitive match
    const key = Object.keys(COMPANY_INTEL_DB).find(
      (k) => k.toLowerCase() === companyName.toLowerCase()
    );
    if (key) {
      return COMPANY_INTEL_DB[key];
    }

    // Try partial match
    const partialKey = Object.keys(COMPANY_INTEL_DB).find(
      (k) =>
        k.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(k.toLowerCase())
    );
    if (partialKey) {
      return COMPANY_INTEL_DB[partialKey];
    }

    return null;
  },
};
