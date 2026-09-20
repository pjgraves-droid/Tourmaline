export const pricing = {
  currency: "AUD",
  minNights: 2,
  maxGuests: 10,
  cleaningFee: Number(process.env.CLEANING_FEE_AUD ?? 0),
  weekday: 1500,
  weekend: 2300,
  seasons: [
    { name: "Summer peak", from: "12-15", to: "01-31", weekday: 2200, weekend: 2750 },
    { name: "Autumn", from: "02-01", to: "04-30", weekday: 2000, weekend: 2750 },
  ],
  weeklyDiscountPct: 10,
} as const;
