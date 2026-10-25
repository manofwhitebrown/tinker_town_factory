// All machine tuning lives here. Order matters: machine N unlocks
// once you own at least one level of machine N-1.
//
//   baseCost    price of the first level (price of level L+1 = baseCost * growth^L)
//   baseOutput  coins per production cycle, per level
//   cycleTime   seconds one production cycle takes
//   costGrowth  optional override of CONFIG.costGrowth

export const WINGS = [{ id: 'cloth', name: 'Cloth Works' }];

export const MACHINES = [
  {
    id: 'sewing', wing: 'cloth', name: 'Sewing Machine', icon: 'sewing',
    color: '#d6455d', baseCost: 15, baseOutput: 1, cycleTime: 0.6,
  },
  {
    id: 'loom', wing: 'cloth', name: 'Weaving Loom', icon: 'loom',
    color: '#2f7f79', baseCost: 120, baseOutput: 9, cycleTime: 2,
  },
  {
    id: 'dyevat', wing: 'cloth', name: 'Dye Vat', icon: 'dyevat',
    color: '#6a4fb3', baseCost: 1100, baseOutput: 80, cycleTime: 3,
  },
  {
    id: 'buttonpress', wing: 'cloth', name: 'Button Press', icon: 'button',
    color: '#c77a1a', baseCost: 12000, baseOutput: 720, cycleTime: 4,
  },
  {
    id: 'embroidery', wing: 'cloth', name: 'Embroidery Arm', icon: 'embroidery',
    color: '#3b6fb6', baseCost: 130000, baseOutput: 6500, cycleTime: 6,
  },
  {
    id: 'tailorbot', wing: 'cloth', name: 'Tailor Bot', icon: 'tailorbot',
    color: '#4c8c3a', baseCost: 1400000, baseOutput: 60000, cycleTime: 8,
  },
];

export const MACHINE_BY_ID = Object.fromEntries(MACHINES.map((m) => [m.id, m]));
