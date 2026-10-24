// src/levels.js - 15 Progressive Sectors with 1★, 2★, 3★ Thresholds and Quantum Core Objectives

export const SECTORS = [
  {
    id: 1,
    nameEN: 'Sector 01: Initial Uplink',
    namePT: 'Setor 01: Enlace Inicial',
    type: 'score',
    targetScore: 800,
    star1: 400,
    star2: 600,
    star3: 800,
    coinsReward: 150,
    descriptionEN: 'Stabilize the network. Reach 400 pts for 1★, 800 for 3★.',
    descriptionPT: 'Estabilize a rede. Atinja 400 pts para 1★, 800 para 3★.',
    preplaced: []
  },
  {
    id: 2,
    nameEN: 'Sector 02: Flux Distributor',
    namePT: 'Setor 02: Distribuidor de Fluxo',
    type: 'lines',
    targetLines: 5,
    star1: 2,
    star2: 4,
    star3: 5,
    coinsReward: 180,
    descriptionEN: 'Collapse rows or columns. 2 lines for 1★, 5 for 3★.',
    descriptionPT: 'Colapse linhas ou colunas. 2 linhas para 1★, 5 para 3★.',
    preplaced: []
  },
  {
    id: 3,
    nameEN: 'Sector 03: Resonance Chamber',
    namePT: 'Setor 03: Câmara de Ressonância',
    type: 'cores',
    targetCores: 2,
    star1: 1,
    star2: 2,
    star3: 2,
    coinsReward: 200,
    descriptionEN: 'Purify 2 Quantum Core blocks embedded in the grid.',
    descriptionPT: 'Purifique 2 Núcleos Quânticos embutidos na grade.',
    preplaced: [
      { r: 2, c: 2, isCore: true, color: '#f59e0b' },
      { r: 5, c: 5, isCore: true, color: '#f59e0b' }
    ]
  },
  {
    id: 4,
    nameEN: 'Sector 04: Quantum Buffer',
    namePT: 'Setor 04: Buffer Quântico',
    type: 'score',
    targetScore: 1500,
    star1: 800,
    star2: 1200,
    star3: 1500,
    coinsReward: 220,
    descriptionEN: 'Chain multi-line collapses to reach 1,500 points.',
    descriptionPT: 'Encadeie multi-colapsos para alcançar 1.500 pontos.',
    preplaced: []
  },
  {
    id: 5,
    nameEN: 'Sector 05: Firewall Overdrive',
    namePT: 'Setor 05: Sobrecarga de Firewall',
    type: 'lines',
    targetLines: 8,
    star1: 4,
    star2: 6,
    star3: 8,
    coinsReward: 250,
    descriptionEN: 'Break through firewall blocks. Collapse 8 lines.',
    descriptionPT: 'Rompa os blocos de firewall. Colapse 8 linhas.',
    preplaced: [
      { r: 3, c: 3, isCore: false, color: '#ef4444' },
      { r: 3, c: 4, isCore: false, color: '#ef4444' },
      { r: 4, c: 3, isCore: false, color: '#ef4444' },
      { r: 4, c: 4, isCore: false, color: '#ef4444' }
    ]
  },
  {
    id: 6,
    nameEN: 'Sector 06: Neural Conduit',
    namePT: 'Setor 06: Conduto Neural',
    type: 'cores',
    targetCores: 3,
    star1: 1,
    star2: 2,
    star3: 3,
    coinsReward: 280,
    descriptionEN: 'Align rows and columns to purge 3 unstable cores.',
    descriptionPT: 'Alinhe linhas e colunas para purgar 3 núcleos instáveis.',
    preplaced: [
      { r: 1, c: 3, isCore: true, color: '#f59e0b' },
      { r: 6, c: 4, isCore: true, color: '#f59e0b' },
      { r: 3, c: 6, isCore: true, color: '#f59e0b' }
    ]
  },
  {
    id: 7,
    nameEN: 'Sector 07: Cryo Cache',
    namePT: 'Setor 07: Cache Criogênico',
    type: 'score',
    targetScore: 2200,
    star1: 1100,
    star2: 1700,
    star3: 2200,
    coinsReward: 300,
    descriptionEN: 'Accumulate 2,200 points. Maintain your combo streak!',
    descriptionPT: 'Acumule 2.200 pontos. Mantenha sua sequência de combo!',
    preplaced: []
  },
  {
    id: 8,
    nameEN: 'Sector 08: Glitch Singularity',
    namePT: 'Setor 08: Singularidade Glitch',
    type: 'lines',
    targetLines: 10,
    star1: 5,
    star2: 8,
    star3: 10,
    coinsReward: 330,
    descriptionEN: 'Collapse 10 lines amid quantum fluctuations.',
    descriptionPT: 'Colapse 10 linhas em meio a flutuações quânticas.',
    preplaced: [
      { r: 0, c: 0, isCore: false, color: '#8b5cf6' },
      { r: 0, c: 7, isCore: false, color: '#8b5cf6' },
      { r: 7, c: 0, isCore: false, color: '#8b5cf6' },
      { r: 7, c: 7, isCore: false, color: '#8b5cf6' }
    ]
  },
  {
    id: 9,
    nameEN: 'Sector 09: Data Stream 2142',
    namePT: 'Setor 09: Fluxo de Dados 2142',
    type: 'cores',
    targetCores: 4,
    star1: 2,
    star2: 3,
    star3: 4,
    coinsReward: 360,
    descriptionEN: 'Stabilize 4 critical quantum cores to open the gateway.',
    descriptionPT: 'Estabilize 4 núcleos quânticos para abrir o portal.',
    preplaced: [
      { r: 1, c: 1, isCore: true, color: '#f59e0b' },
      { r: 1, c: 6, isCore: true, color: '#f59e0b' },
      { r: 6, c: 1, isCore: true, color: '#f59e0b' },
      { r: 6, c: 6, isCore: true, color: '#f59e0b' }
    ]
  },
  {
    id: 10,
    nameEN: 'Sector 10: Cyber Bastion',
    namePT: 'Setor 10: Bastião Cibernético',
    type: 'score',
    targetScore: 3200,
    star1: 1600,
    star2: 2400,
    star3: 3200,
    coinsReward: 400,
    descriptionEN: 'Reach 3,200 points to break the mega-encryption.',
    descriptionPT: 'Atinja 3.200 pontos para romper a mega-criptografia.',
    preplaced: []
  },
  {
    id: 11,
    nameEN: 'Sector 11: Hyper-Loop Terminal',
    namePT: 'Setor 11: Terminal Hiperloop',
    type: 'lines',
    targetLines: 12,
    star1: 6,
    star2: 9,
    star3: 12,
    coinsReward: 440,
    descriptionEN: 'Collapse 12 lines through high-speed quantum lanes.',
    descriptionPT: 'Colapse 12 linhas através das vias quânticas velozes.',
    preplaced: [
      { r: 2, c: 4, isCore: false, color: '#06b6d4' },
      { r: 5, c: 3, isCore: false, color: '#06b6d4' }
    ]
  },
  {
    id: 12,
    nameEN: 'Sector 12: Plasma Reactor',
    namePT: 'Setor 12: Reator de Plasma',
    type: 'cores',
    targetCores: 5,
    star1: 2,
    star2: 4,
    star3: 5,
    coinsReward: 480,
    descriptionEN: 'Purify 5 overheating plasma cores before meltdown.',
    descriptionPT: 'Purifique 5 núcleos de plasma superaquecidos.',
    preplaced: [
      { r: 0, c: 3, isCore: true, color: '#f59e0b' },
      { r: 7, c: 4, isCore: true, color: '#f59e0b' },
      { r: 3, c: 0, isCore: true, color: '#f59e0b' },
      { r: 4, c: 7, isCore: true, color: '#f59e0b' },
      { r: 3, c: 3, isCore: true, color: '#f59e0b' }
    ]
  },
  {
    id: 13,
    nameEN: 'Sector 13: Entanglement Zone',
    namePT: 'Setor 13: Zona de Entrelaçamento',
    type: 'score',
    targetScore: 4500,
    star1: 2200,
    star2: 3400,
    star3: 4500,
    coinsReward: 520,
    descriptionEN: 'Attain 4,500 points in the dense quantum nexus.',
    descriptionPT: 'Alcance 4.500 pontos no denso nexo quântico.',
    preplaced: []
  },
  {
    id: 14,
    nameEN: 'Sector 14: Zero-Point Singularity',
    namePT: 'Setor 14: Ponto Zero',
    type: 'lines',
    targetLines: 15,
    star1: 7,
    star2: 11,
    star3: 15,
    coinsReward: 600,
    descriptionEN: 'Collapse 15 lines before total gravity collapse.',
    descriptionPT: 'Colapse 15 linhas antes do colapso gravitacional total.',
    preplaced: [
      { r: 2, c: 2, isCore: false, color: '#ec4899' },
      { r: 2, c: 5, isCore: false, color: '#ec4899' },
      { r: 5, c: 2, isCore: false, color: '#ec4899' },
      { r: 5, c: 5, isCore: false, color: '#ec4899' }
    ]
  },
  {
    id: 15,
    nameEN: 'Sector 15: Master Quantum Core',
    namePT: 'Setor 15: Núcleo Quântico Mestre',
    type: 'cores',
    targetCores: 6,
    star1: 3,
    star2: 5,
    star3: 6,
    coinsReward: 1000,
    descriptionEN: 'Purify all 6 master core fragments to stabilize 2142!',
    descriptionPT: 'Purifique todos os 6 núcleos mestres para estabilizar 2142!',
    preplaced: [
      { r: 1, c: 1, isCore: true, color: '#f59e0b' },
      { r: 1, c: 6, isCore: true, color: '#f59e0b' },
      { r: 3, c: 3, isCore: true, color: '#f59e0b' },
      { r: 4, c: 4, isCore: true, color: '#f59e0b' },
      { r: 6, c: 1, isCore: true, color: '#f59e0b' },
      { r: 6, c: 6, isCore: true, color: '#f59e0b' }
    ]
  }
];
