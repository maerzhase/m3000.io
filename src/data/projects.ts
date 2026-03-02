export type Project = {
  id: string;
  title: string;
  description: string;
  images: string[]; // up to 3 image paths
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
        description:
          "The largest open platform for generative art. Built the full-stack from marketplace UI to on-chain minting across Tezos and Ethereum.",
        images: [
          "/images/placeholder-1.jpg",
          "/images/placeholder-2.jpg",
          "/images/placeholder-3.jpg",
        ],
        href: "https://fxhash.xyz",
        color: "#ff2f00",
      },
      {
        id: "fxhash-mint",
        title: "Minting Pipeline",
        description:
          "End-to-end pipeline for generative token creation, from code upload and sandbox preview to on-chain deployment and IPFS storage.",
        images: ["/images/placeholder-4.jpg", "/images/placeholder-5.jpg"],
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
        description:
          "Large-scale interactive installations translating complex datasets into tangible, immersive environments using custom hardware and real-time graphics.",
        images: [
          "/images/placeholder-6.jpg",
          "/images/placeholder-7.jpg",
          "/images/placeholder-8.jpg",
        ],
        href: "https://nand.io",
        color: "#bda150",
      },
      {
        id: "nand-ux",
        title: "Digital Products",
        description:
          "Design systems and interactive prototypes for enterprise clients, bridging UX research with production-ready component architectures.",
        images: ["/images/placeholder-9.jpg"],
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
        description:
          "Symphonie Cinetique: choreographed mechanical installation with hundreds of individually controlled kinetic elements responding to musical compositions.",
        images: [
          "/images/placeholder-10.jpg",
          "/images/placeholder-11.jpg",
        ],
        href: "https://artcom.de/en/project/symphonie-cinetique/",
        color: "#ff2f00",
      },
      {
        id: "artcom-immersive",
        title: "Immersive Spaces",
        description:
          "Spatial installations combining projection mapping, sensor networks, and generative visuals to create responsive architectural environments.",
        images: [
          "/images/placeholder-12.jpg",
          "/images/placeholder-13.jpg",
          "/images/placeholder-14.jpg",
        ],
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
        description:
          "Thesis on computational linguistics exploring how algorithmic logic interacts with natural language structures and meaning-making.",
        images: ["/images/placeholder-15.jpg"],
        color: "#bda150",
      },
    ],
  },
];
