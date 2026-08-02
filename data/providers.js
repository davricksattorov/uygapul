/* uygapul.com — provider data
   This file is rewritten by admin.html. You can also edit it by hand.
   fxMargin : share taken off the mid-market rate (0.005 = 0.50%)
   fee      : fixed fee in EUR
   mins     : typical delivery time in minutes
   checked  : the date YOU last verified this against a real receipt
*/
window.UYGAPUL = {
  updated: "2026-08-02",
  fallbackRate: 13600,
  providers: [
    { name: "Profee",     fxMargin: 0.0050, fee: 1.15, mins: 5,   url: "https://www.profee.com/",     checked: "2026-08-02", note: "" },
    { name: "Wise",       fxMargin: 0.0060, fee: 0.90, mins: 120, url: "https://wise.com/",           checked: "2026-08-02", note: "" },
    { name: "TransferGo", fxMargin: 0.0090, fee: 0.99, mins: 60,  url: "https://www.transfergo.com/", checked: "2026-08-02", note: "" },
    { name: "Paysend",    fxMargin: 0.0120, fee: 2.00, mins: 30,  url: "https://paysend.com/",        checked: "2026-08-02", note: "" }
  ]
};
