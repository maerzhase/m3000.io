export type Project = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  href?: string;
  color: string;
};

export type ProjectGroup = {
  id: string;
  projects: Project[];
};

export const projectGroups: ProjectGroup[] = [
  {
    id: "fxhash",
    projects: [
      {
        id: "fxhash-platform",
        title: "fxhash",
        subtitle: "Generative Art Platform",
        tags: ["Next.js", "TypeScript", "GraphQL"],
        href: "https://fxhash.xyz",
        color: "#ff2f00",
      },
      {
        id: "fxhash-mint",
        title: "Minting Pipeline",
        subtitle: "On-chain Generative Tokens",
        tags: ["Solidity", "Tezos", "IPFS"],
        color: "#ff5a33",
      },
    ],
  },
  {
    id: "nand",
    projects: [
      {
        id: "nand-dataviz",
        title: "Data Experiences",
        subtitle: "Interactive Installations",
        tags: ["D3.js", "WebGL", "Arduino"],
        href: "https://nand.io",
        color: "#bda150",
      },
      {
        id: "nand-ux",
        title: "Digital Products",
        subtitle: "UX & Design Systems",
        tags: ["React", "Figma", "Storybook"],
        color: "#d4b85c",
      },
    ],
  },
  {
    id: "artcom",
    projects: [
      {
        id: "artcom-kinetic",
        title: "Kinetic Sculptures",
        subtitle: "Symphonie Cinetique",
        tags: ["C++", "Processing", "Motors"],
        href: "https://artcom.de/en/project/symphonie-cinetique/",
        color: "#ff2f00",
      },
      {
        id: "artcom-immersive",
        title: "Immersive Spaces",
        subtitle: "Spatial Installations",
        tags: ["openFrameworks", "Sensors", "Projection"],
        color: "#cc2600",
      },
    ],
  },
  {
    id: "thesis",
    projects: [
      {
        id: "thesis-sprache",
        title: "Sprache / Algorithmen",
        subtitle: "Computational Linguistics",
        tags: ["NLP", "Algorithms", "Language"],
        color: "#bda150",
      },
    ],
  },
];
