const nprFormatter = new Intl.NumberFormat("en-NP", {
  maximumFractionDigits: 0,
});

export const formatNPR = (amount: number) => `NPR ${nprFormatter.format(amount)}`;
