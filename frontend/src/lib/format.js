const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const periodLabel = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export const money = (n) =>
  `LKR ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const monthLabel = (ym) => 
   MONTHS[Number(ym.slice(5, 7)) - 1];
export const UNITS = { electricity: 'kWh', water: 'm³', gas: 'kg' };