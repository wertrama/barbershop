const STORAGE_KEY = "cashflow_sheet_ru_form_v2";

/**
 * Здесь ты меняешь “сколько строк нужно”.
 * Хочешь больше — увеличь числа.
 */
const COUNTS = {
  incomeProperties: 8,  // доходы: недвижимость CF
  incomeBusinesses: 8,  // доходы: бизнес CF
  incomeOther: 6,       // доходы: прочее

  stocks: 10,           // активы: акции строк
  realEstate: 8,        // активы: недвижимость строк
  business: 8,          // активы: бизнес строк
};

const out = {
  passiveIncome: document.getElementById("passiveIncomeOut"),
  totalIncome: document.getElementById("totalIncomeOut"),
  totalExpenses: document.getElementById("totalExpensesOut"),
  monthlyCashflow: document.getElementById("monthlyCashflowOut"),
  totalAssets: document.getElementById("totalAssetsOut"),
  totalLiabilities: document.getElementById("totalLiabilitiesOut"),
  netWorth: document.getElementById("netWorthOut"),
};

const els = {
  currencySelect: document.getElementById("currencySelect"),
  printBtn: document.getElementById("printBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  resetBtn: document.getElementById("resetBtn"),

  incomeProperties: document.getElementById("incomeProperties"),
  incomeBusinesses: document.getElementById("incomeBusinesses"),
  incomeOther: document.getElementById("incomeOther"),

  stocksRows: document.getElementById("stocksRows"),
  realEstateRows: document.getElementById("realEstateRows"),
  businessRows: document.getElementById("businessRows"),
};

const defaultData = {
  currency: "₽",
  meta: { profession: "", player: "" },

  income: {
    salary: 0,
    interest: 0,
    dividends: 0,
    properties: Array.from({ length: COUNTS.incomeProperties }, () => ({ name: "", cashFlow: 0 })),
    businesses: Array.from({ length: COUNTS.incomeBusinesses }, () => ({ name: "", cashFlow: 0 })),
    other: Array.from({ length: COUNTS.incomeOther }, () => ({ name: "", value: 0 })),
  },

  children: { count: 0, perChildExpense: 0 },

  expenses: {
    taxes: 0,
    homeMortgagePay: 0,
    schoolLoanPay: 0,
    carPay: 0,
    creditCardMin: 0,
    retailPay: 0,
    other: 0,
    childAuto: 0,     // вычисляется
    bankLoanPay: 0,
  },

  assets: {
    savings: 0,
    stocks: Array.from({ length: COUNTS.stocks }, () => ({ name: "", shares: 0, costPer: 0 })),
    realEstate: Array.from({ length: COUNTS.realEstate }, () => ({ name: "", down: 0, cost: 0 })),
    business: Array.from({ length: COUNTS.business }, () => ({ name: "", down: 0, cost: 0 })),
  },

  liabilities: {
    homeMortgage: 0,
    schoolLoans: 0,
    carLoans: 0,
    creditCards: 0,
    retailDebt: 0,
    reMortgage: 0,
    businessLiability: 0,
    bankLoan: 0,
  },
};

let data = loadData();

// 1) Генерируем дополнительные поля (DOM)
// 2) Подключаем обработчики ввода
// 3) Заполняем значения и считаем
generateDynamicRows();
bindAllInputs();
renderAll();

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);

    const merged = structuredClone(defaultData);

    merged.currency = parsed?.currency ?? merged.currency;
    merged.meta.profession = parsed?.meta?.profession ?? "";
    merged.meta.player = parsed?.meta?.player ?? "";

    // простые объекты
    Object.assign(merged.children, parsed?.children ?? {});
    Object.assign(merged.expenses, parsed?.expenses ?? {});
    Object.assign(merged.liabilities, parsed?.liabilities ?? {});
    merged.assets.savings = parsed?.assets?.savings ?? merged.assets.savings;

    // income arrays
    merged.income.salary = parsed?.income?.salary ?? merged.income.salary;
    merged.income.interest = parsed?.income?.interest ?? merged.income.interest;
    merged.income.dividends = parsed?.income?.dividends ?? merged.income.dividends;

    merged.income.properties = normalizeRows(parsed?.income?.properties, COUNTS.incomeProperties, { name: "", cashFlow: 0 });
    merged.income.businesses = normalizeRows(parsed?.income?.businesses, COUNTS.incomeBusinesses, { name: "", cashFlow: 0 });
    merged.income.other = normalizeRows(parsed?.income?.other, COUNTS.incomeOther, { name: "", value: 0 });

    // assets arrays
    merged.assets.stocks = normalizeRows(parsed?.assets?.stocks, COUNTS.stocks, { name: "", shares: 0, costPer: 0 });
    merged.assets.realEstate = normalizeRows(parsed?.assets?.realEstate, COUNTS.realEstate, { name: "", down: 0, cost: 0 });
    merged.assets.business = normalizeRows(parsed?.assets?.business, COUNTS.business, { name: "", down: 0, cost: 0 });

    return merged;
  } catch {
    return structuredClone(defaultData);
  }
}

function normalizeRows(arr, need, fallback) {
  const safe = Array.isArray(arr) ? arr : [];
  const out = [];
  for (let i = 0; i < need; i++) {
    const src = safe[i] ?? {};
    out.push({ ...structuredClone(fallback), ...src });
  }
  return out;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function parseNumber(v) {
  const s = String(v ?? "").trim().replace(/\s+/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseIntSafe(v) {
  const n = Math.trunc(parseNumber(v));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function formatMoney(n) {
  const currency = data.currency || "₽";
  const value = Number.isFinite(n) ? n : 0;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    if (key.match(/^\d+$/)) return acc[Number(key)];
    return acc[key];
  }, obj);
}

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur = k.match(/^\d+$/) ? cur[Number(k)] : cur[k];
  }
  const last = keys[keys.length - 1];
  if (last.match(/^\d+$/)) cur[Number(last)] = value;
  else cur[last] = value;
}

/** ======== Генерация дополнительных строк ======== */

function generateDynamicRows() {
  // Income: properties
  els.incomeProperties.innerHTML = "";
  for (let i = 0; i < COUNTS.incomeProperties; i++) {
    els.incomeProperties.appendChild(makeTwoColRow(
      `income.properties.${i}.name`,
      `income.properties.${i}.cashFlow`
    ));
  }

  // Income: businesses
  els.incomeBusinesses.innerHTML = "";
  for (let i = 0; i < COUNTS.incomeBusinesses; i++) {
    els.incomeBusinesses.appendChild(makeTwoColRow(
      `income.businesses.${i}.name`,
      `income.businesses.${i}.cashFlow`
    ));
  }

  // Income: other
  els.incomeOther.innerHTML = "";
  for (let i = 0; i < COUNTS.incomeOther; i++) {
    els.incomeOther.appendChild(makeTwoColRow(
      `income.other.${i}.name`,
      `income.other.${i}.value`
    ));
  }

  // Assets: stocks (3 колонки)
  els.stocksRows.innerHTML = "";
  for (let i = 0; i < COUNTS.stocks; i++) {
    els.stocksRows.appendChild(makeThreeColRow(
      `assets.stocks.${i}.name`,
      `assets.stocks.${i}.shares`,
      `assets.stocks.${i}.costPer`
    ));
  }

  // Assets: real estate (3 колонки)
  els.realEstateRows.innerHTML = "";
  for (let i = 0; i < COUNTS.realEstate; i++) {
    els.realEstateRows.appendChild(makeThreeColRow(
      `assets.realEstate.${i}.name`,
      `assets.realEstate.${i}.down`,
      `assets.realEstate.${i}.cost`
    ));
  }

  // Assets: business (3 колонки)
  els.businessRows.innerHTML = "";
  for (let i = 0; i < COUNTS.business; i++) {
    els.businessRows.appendChild(makeThreeColRow(
      `assets.business.${i}.name`,
      `assets.business.${i}.down`,
      `assets.business.${i}.cost`
    ));
  }
}

function makeTwoColRow(pathName, pathValue) {
  const row = document.createElement("div");
  row.className = "row";

  const name = document.createElement("input");
  name.className = "lineInput small";
  name.type = "text";
  name.dataset.path = pathName;

  const val = document.createElement("input");
  val.className = "numInput";
  val.type = "text";
  val.dataset.type = "number";
  val.dataset.path = pathValue;

  row.appendChild(name);
  row.appendChild(val);
  return row;
}

function makeThreeColRow(pathA, pathB, pathC) {
  const row = document.createElement("div");
  row.className = "miniRow";

  const a = document.createElement("input");
  a.className = "lineInput small";
  a.type = "text";
  a.dataset.path = pathA;

  const b = document.createElement("input");
  b.className = "numInput";
  b.type = "text";
  b.dataset.type = "number";
  b.dataset.path = pathB;

  const c = document.createElement("input");
  c.className = "numInput";
  c.type = "text";
  c.dataset.type = "number";
  c.dataset.path = pathC;

  row.appendChild(a);
  row.appendChild(b);
  row.appendChild(c);
  return row;
}

/** ======== Bind inputs ======== */

function bindAllInputs() {
  const inputs = document.querySelectorAll("[data-path]");
  inputs.forEach((el) => {
    const path = el.dataset.path;
    const type = el.dataset.type || "text";

    el.addEventListener("input", () => {
      if (el.hasAttribute("readonly")) return;

      let val;
      if (type === "number") val = parseNumber(el.value);
      else if (type === "int") val = parseIntSafe(el.value);
      else val = el.value;

      setByPath(data, path, val);
      saveData();
      recalcAndRender();
    });
  });

  els.currencySelect.addEventListener("change", () => {
    data.currency = els.currencySelect.value;
    saveData();
    recalcAndRender();
  });

  els.printBtn.addEventListener("click", () => window.print());
  els.exportBtn.addEventListener("click", exportJSON);

  els.importInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importJSON(file);
    e.target.value = "";
  });

  els.resetBtn.addEventListener("click", () => {
    const ok = confirm("Сбросить всё? Данные на этом устройстве будут удалены.");
    if (!ok) return;
    data = structuredClone(defaultData);
    saveData();

    // важно: если ты поменял COUNTS — пересоздадим DOM поля
    generateDynamicRows();
    bindAllInputs();
    renderAll();
  });
}

/** ======== Render + Calculations ======== */

function renderAll() {
  els.currencySelect.value = data.currency || "₽";

  const inputs = document.querySelectorAll("[data-path]");
  inputs.forEach((el) => {
    const path = el.dataset.path;
    const type = el.dataset.type || "text";
    const val = getByPath(data, path);

    if (el.hasAttribute("readonly")) return;

    if (type === "number" || type === "int") el.value = (val ?? 0);
    else el.value = (val ?? "");
  });

  recalcAndRender();
}

function recalcAndRender() {
  // Дети -> childAuto
  const kids = parseIntSafe(data.children.count);
  const perKid = parseNumber(data.children.perChildExpense);
  const childAuto = kids * perKid;
  data.children.count = kids;
  data.children.perChildExpense = perKid;
  data.expenses.childAuto = childAuto;

  const childField = document.querySelector('[data-path="expenses.childAuto"]');
  if (childField) childField.value = formatMoney(childAuto);

  // Income totals
  const income = data.income;

  const propsCF = income.properties.reduce((a, r) => a + parseNumber(r.cashFlow), 0);
  const bizCF = income.businesses.reduce((a, r) => a + parseNumber(r.cashFlow), 0);
  const otherIncome = income.other.reduce((a, r) => a + parseNumber(r.value), 0);

  const totalIncome =
    parseNumber(income.salary) +
    parseNumber(income.interest) +
    parseNumber(income.dividends) +
    propsCF +
    bizCF +
    otherIncome;

  const passiveIncome =
    parseNumber(income.interest) +
    parseNumber(income.dividends) +
    propsCF +
    bizCF;

  // Expenses totals
  const ex = data.expenses;
  const totalExpenses =
    parseNumber(ex.taxes) +
    parseNumber(ex.homeMortgagePay) +
    parseNumber(ex.schoolLoanPay) +
    parseNumber(ex.carPay) +
    parseNumber(ex.creditCardMin) +
    parseNumber(ex.retailPay) +
    parseNumber(ex.other) +
    parseNumber(ex.childAuto) +
    parseNumber(ex.bankLoanPay);

  const monthlyCashflow = totalIncome - totalExpenses;

  // Assets totals
  const assets = data.assets;
  const stocksValue = assets.stocks.reduce((acc, r) => acc + parseNumber(r.shares) * parseNumber(r.costPer), 0);
  const realEstateValue = assets.realEstate.reduce((acc, r) => acc + parseNumber(r.cost), 0);
  const businessValue = assets.business.reduce((acc, r) => acc + parseNumber(r.cost), 0);
  const totalAssets = parseNumber(assets.savings) + stocksValue + realEstateValue + businessValue;

  // Liabilities totals
  const l = data.liabilities;
  const totalLiabilities =
    parseNumber(l.homeMortgage) +
    parseNumber(l.schoolLoans) +
    parseNumber(l.carLoans) +
    parseNumber(l.creditCards) +
    parseNumber(l.retailDebt) +
    parseNumber(l.reMortgage) +
    parseNumber(l.businessLiability) +
    parseNumber(l.bankLoan);

  const netWorth = totalAssets - totalLiabilities;

  // Output
  out.passiveIncome.textContent = formatMoney(passiveIncome);
  out.totalIncome.textContent = formatMoney(totalIncome);
  out.totalExpenses.textContent = formatMoney(totalExpenses);
  out.monthlyCashflow.textContent = formatMoney(monthlyCashflow);
  out.totalAssets.textContent = formatMoney(totalAssets);
  out.totalLiabilities.textContent = formatMoney(totalLiabilities);
  out.netWorth.textContent = formatMoney(netWorth);

  out.monthlyCashflow.style.color = monthlyCashflow >= 0 ? "#0a7a3c" : "#b00020";
  out.netWorth.style.color = netWorth >= 0 ? "#0a7a3c" : "#b00020";

  saveData();
}

/** ======== Import/Export ======== */

function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cashflow-sheet-ru.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!parsed || typeof parsed !== "object") throw new Error("bad");

      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      data = loadData();

      // если в JSON меньше строк — normalizeRows добьёт до COUNTS
      // если больше — лишнее просто не покажем (можно увеличить COUNTS)
      generateDynamicRows();
      bindAllInputs();
      renderAll();

      alert("Импорт выполнен ✅");
    } catch {
      alert("Не удалось импортировать. Проверь JSON-файл.");
    }
  };
  reader.readAsText(file);
}
