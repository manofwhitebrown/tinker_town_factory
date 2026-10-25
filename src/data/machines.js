// All machine and wing tuning lives here.
//
// Machine fields:
//   baseCost    price of the first level (price of level L+1 = baseCost * growth^L)
//   baseOutput  coins per production cycle, per level
//   cycleTime   seconds one production cycle takes
//   autoCost    price of the Automate upgrade (defaults to 5 x baseCost)
//   costGrowth  optional override of CONFIG.costGrowth
//
// Within a wing, machine N unlocks once you own at least one level of machine N-1.
// A wing opens automatically once your lifetime earnings reach its `unlockAt`.
// All wings share one coin pool: later wings are simply bigger numbers.

export const WINGS = [
  { id: 'cloth', name: 'Cloth Works', short: 'Cloth', unlockAt: 0, paper: '#e4ebf1' },
  { id: 'toys', name: 'Toy Shop', short: 'Toys', unlockAt: 5e6, paper: '#e1efe8' },
  { id: 'gadgets', name: 'Gadget Garage', short: 'Gadgets', unlockAt: 1e12, paper: '#e8e6f2' },
  { id: 'candy', name: 'Candy Kitchen', short: 'Candy', unlockAt: 2e17, paper: '#f4e4ea' },
];

const machine = (def) => ({ autoCost: Math.round(def.baseCost * 5), ...def });

export const MACHINES = [
  // ---- cloth ----
  machine({ id: 'sewing', wing: 'cloth', name: 'Sewing Machine', icon: 'sewing', color: '#d6455d', baseCost: 15, baseOutput: 1, cycleTime: 0.6 }),
  machine({ id: 'loom', wing: 'cloth', name: 'Weaving Loom', icon: 'loom', color: '#2f7f79', baseCost: 120, baseOutput: 9, cycleTime: 2 }),
  machine({ id: 'dyevat', wing: 'cloth', name: 'Dye Vat', icon: 'dyevat', color: '#6a4fb3', baseCost: 1100, baseOutput: 80, cycleTime: 3 }),
  machine({ id: 'buttonpress', wing: 'cloth', name: 'Button Press', icon: 'button', color: '#c77a1a', baseCost: 12000, baseOutput: 720, cycleTime: 4 }),
  machine({ id: 'embroidery', wing: 'cloth', name: 'Embroidery Arm', icon: 'embroidery', color: '#3b6fb6', baseCost: 130000, baseOutput: 6500, cycleTime: 6 }),
  machine({ id: 'tailorbot', wing: 'cloth', name: 'Tailor Bot', icon: 'tailorbot', color: '#4c8c3a', baseCost: 1.4e6, baseOutput: 60000, cycleTime: 8 }),
  // ---- toys ----
  machine({ id: 'stuffing', wing: 'toys', name: 'Stuffing Station', icon: 'teddy', color: '#b5651d', baseCost: 1.6e7, baseOutput: 550000, cycleTime: 10 }),
  machine({ id: 'blockcutter', wing: 'toys', name: 'Block Cutter', icon: 'blocks', color: '#e0592a', baseCost: 1.8e8, baseOutput: 5.1e6, cycleTime: 12 }),
  machine({ id: 'tracklayer', wing: 'toys', name: 'Track Layer', icon: 'train', color: '#2b7a78', baseCost: 2.1e9, baseOutput: 4.7e7, cycleTime: 14 }),
  machine({ id: 'yoyo', wing: 'toys', name: 'Yo-Yo Spinner', icon: 'yoyo', color: '#c43d6b', baseCost: 2.4e10, baseOutput: 4.4e8, cycleTime: 16 }),
  machine({ id: 'musicbox', wing: 'toys', name: 'Music Box Maker', icon: 'musicbox', color: '#5b57b8', baseCost: 2.8e11, baseOutput: 4e9, cycleTime: 20 }),
  // ---- gadgets ----
  machine({ id: 'gearpress', wing: 'gadgets', name: 'Gear Press', icon: 'gear', color: '#55688a', baseCost: 3.2e12, baseOutput: 3.7e10, cycleTime: 24 }),
  machine({ id: 'bulbblower', wing: 'gadgets', name: 'Bulb Blower', icon: 'bulb', color: '#c99500', baseCost: 3.7e13, baseOutput: 3.4e11, cycleTime: 28 }),
  machine({ id: 'etcher', wing: 'gadgets', name: 'Circuit Etcher', icon: 'circuit', color: '#2e8b57', baseCost: 4.3e14, baseOutput: 3.1e12, cycleTime: 32 }),
  machine({ id: 'radiobench', wing: 'gadgets', name: 'Radio Bench', icon: 'radio', color: '#8a4f9e', baseCost: 5e15, baseOutput: 2.9e13, cycleTime: 36 }),
  machine({ id: 'droneline', wing: 'gadgets', name: 'Drone Assembler', icon: 'drone', color: '#1f78b4', baseCost: 5.8e16, baseOutput: 2.7e14, cycleTime: 40 }),
  // ---- candy ----
  machine({ id: 'swirler', wing: 'candy', name: 'Lollipop Swirler', icon: 'lolly', color: '#e0457b', baseCost: 6.7e17, baseOutput: 2.5e15, cycleTime: 45 }),
  machine({ id: 'cupcakeoven', wing: 'candy', name: 'Cupcake Oven', icon: 'cupcake', color: '#c0622b', baseCost: 7.7e18, baseOutput: 2.3e16, cycleTime: 50 }),
  machine({ id: 'taffy', wing: 'candy', name: 'Taffy Puller', icon: 'candy', color: '#7b4fc9', baseCost: 8.9e19, baseOutput: 2.1e17, cycleTime: 55 }),
  machine({ id: 'chocolate', wing: 'candy', name: 'Chocolate Fall', icon: 'chocolate', color: '#6b3e26', baseCost: 1e21, baseOutput: 2e18, cycleTime: 60 }),
  machine({ id: 'cakeworks', wing: 'candy', name: 'Grand Cake Works', icon: 'cake', color: '#d94f70', baseCost: 1.2e22, baseOutput: 1.8e19, cycleTime: 70 }),
];

export const MACHINE_BY_ID = Object.fromEntries(MACHINES.map((m) => [m.id, m]));
export const WING_BY_ID = Object.fromEntries(WINGS.map((w) => [w.id, w]));

/** Previous machine in the same wing (null for the first machine of a wing). */
export const PREV_IN_WING = {};
{
  const last = {};
  for (const m of MACHINES) {
    PREV_IN_WING[m.id] = last[m.wing] || null;
    last[m.wing] = m;
  }
}
