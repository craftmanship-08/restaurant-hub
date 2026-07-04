const STORAGE_KEY = "misenote-prototype-v1";

const today = new Date();
const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDate = (offset) => {
  const value = new Date(today);
  value.setDate(value.getDate() + offset);
  return toDateKey(value);
};

const defaultState = {
  reports: [
    {
      id: 1,
      date: shiftDate(-1),
      author: "佐藤",
      weather: "晴れ",
      guests: 82,
      note: "ランチのパスタセットが好評。13時以降も来店が続きました。",
      handover: "牛乳とトマトソースの納品数を確認してください。",
      createdAt: Date.now() - 86400000,
    },
    {
      id: 2,
      date: shiftDate(-2),
      author: "山田",
      weather: "くもり",
      guests: 68,
      note: "雨予報の影響か夕方は落ち着いた営業でした。店内清掃を実施。",
      handover: "",
      createdAt: Date.now() - 172800000,
    },
  ],
  sales: [
    { date: shiftDate(-6), cash: 39100, card: 58400, delivery: 9800, other: 0 },
    { date: shiftDate(-5), cash: 42500, card: 62000, delivery: 11200, other: 0 },
    { date: shiftDate(-4), cash: 36700, card: 55300, delivery: 8900, other: 0 },
    { date: shiftDate(-3), cash: 46100, card: 69800, delivery: 13500, other: 0 },
    { date: shiftDate(-2), cash: 48800, card: 73100, delivery: 14900, other: 0 },
    { date: shiftDate(-1), cash: 52900, card: 78200, delivery: 16200, other: 0 },
    { date: shiftDate(0), cash: 43200, card: 64700, delivery: 12600, other: 0 },
  ],
  inventory: [
    { id: 1, name: "トマト", category: "野菜", quantity: 3, threshold: 5, unit: "kg" },
    { id: 2, name: "玉ねぎ", category: "野菜", quantity: 12, threshold: 6, unit: "kg" },
    { id: 3, name: "鶏もも肉", category: "肉・魚", quantity: 4, threshold: 5, unit: "kg" },
    { id: 4, name: "パスタ", category: "その他", quantity: 18, threshold: 8, unit: "袋" },
    { id: 5, name: "牛乳", category: "乳製品", quantity: 6, threshold: 8, unit: "本" },
    { id: 6, name: "オリーブオイル", category: "調味料", quantity: 9, threshold: 3, unit: "本" },
    { id: 7, name: "コーヒー豆", category: "飲料", quantity: 7, threshold: 4, unit: "袋" },
  ],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(defaultState);
    const parsed = JSON.parse(saved);
    return {
      reports: Array.isArray(parsed.reports) ? parsed.reports : clone(defaultState.reports),
      sales: Array.isArray(parsed.sales) ? parsed.sales : clone(defaultState.sales),
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : clone(defaultState.inventory),
    };
  } catch {
    return clone(defaultState);
  }
};

let state = loadState();
let inventoryFilter = "all";
let toastTimer;

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const shortYen = (value) => {
  if (value >= 10000) return `${Math.round(value / 1000) / 10}万`;
  return yen.format(value);
};

const formatDate = (dateKey, withYear = false) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const options = withYear
    ? { year: "numeric", month: "long", day: "numeric", weekday: "short" }
    : { month: "numeric", day: "numeric", weekday: "short" };
  return new Intl.DateTimeFormat("ja-JP", options).format(date);
};

const saleTotal = (sale) =>
  Number(sale.cash || 0) +
  Number(sale.card || 0) +
  Number(sale.delivery || 0) +
  Number(sale.other || 0);

const escapeHtml = (text) =>
  String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const showToast = (message) => {
  const toast = document.querySelector("#toast");
  document.querySelector("#toast-message").textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
};

const updateDateLabels = () => {
  document.querySelector("#today-label").textContent = formatDate(toDateKey(today), true);
  document.querySelector("#report-date").value = toDateKey(today);
  document.querySelector("#sales-date").value = toDateKey(today);
};

const renderMetrics = () => {
  const todayKey = toDateKey(today);
  const currentSale = state.sales.find((sale) => sale.date === todayKey);
  const currentReport = state.reports.find((report) => report.date === todayKey);
  const total = currentSale ? saleTotal(currentSale) : 0;
  const guests = currentReport?.guests || 74;
  const lowItems = state.inventory.filter((item) => item.quantity <= item.threshold);

  document.querySelector("#metric-sales").textContent = yen.format(total);
  document.querySelector("#metric-guests").innerHTML = `${guests} <em>名</em>`;
  document.querySelector("#metric-average").textContent = yen.format(guests ? total / guests : 0);
  document.querySelector("#metric-alerts").textContent = lowItems.length;

  const navBadge = document.querySelector("#inventory-nav-badge");
  navBadge.textContent = lowItems.length;
  navBadge.classList.toggle("visible", lowItems.length > 0);

  const previousSale = state.sales.find((sale) => sale.date === shiftDate(-6));
  const previousTotal = previousSale ? saleTotal(previousSale) : total;
  const salesDiff = previousTotal ? Math.round(((total - previousTotal) / previousTotal) * 100) : 0;
  document.querySelector("#metric-sales-trend").textContent =
    `前週比 ${salesDiff >= 0 ? "+" : ""}${salesDiff}%`;

  const guestDiff = Math.round(((guests - 68) / 68) * 100);
  document.querySelector("#metric-guests-trend").textContent =
    `前週比 ${guestDiff >= 0 ? "+" : ""}${guestDiff}%`;
};

const renderChart = () => {
  const recent = [...state.sales].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const max = Math.max(...recent.map(saleTotal), 150000);
  const weeklyTotal = recent.reduce((sum, sale) => sum + saleTotal(sale), 0);

  document.querySelector("#weekly-total").textContent = yen.format(weeklyTotal);
  document.querySelector("#sales-page-week-total").textContent = yen.format(weeklyTotal);
  document.querySelector("#sales-chart").innerHTML = recent
    .map((sale) => {
      const total = saleTotal(sale);
      const height = Math.max(5, Math.round((total / max) * 100));
      const date = new Date(`${sale.date}T00:00:00`);
      const day = new Intl.DateTimeFormat("ja-JP", { weekday: "short" })
        .format(date)
        .replace("曜日", "");
      return `
        <div class="bar-column ${sale.date === toDateKey(today) ? "today" : ""}" style="--height:${height}%">
          <span class="bar-value">${shortYen(total)}</span>
          <div class="bar"></div>
          <span class="bar-label">${day}</span>
        </div>
      `;
    })
    .join("");
};

const renderDashboardAlerts = () => {
  const lowItems = state.inventory.filter((item) => item.quantity <= item.threshold).slice(0, 3);
  const container = document.querySelector("#dashboard-alert-list");
  if (!lowItems.length) {
    container.innerHTML = '<div class="empty-message">現在、発注が必要な食材はありません。</div>';
    return;
  }

  container.innerHTML = lowItems
    .map(
      (item) => `
        <div class="alert-item">
          <span class="alert-symbol">!</span>
          <span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>発注の目安：${item.threshold}${escapeHtml(item.unit)}</small>
          </span>
          <span class="alert-quantity">残り ${item.quantity}${escapeHtml(item.unit)}</span>
        </div>
      `,
    )
    .join("");
};

const renderActivities = () => {
  const activities = [];
  state.reports.slice(0, 2).forEach((report) => {
    activities.push({
      type: "report",
      title: `${formatDate(report.date)}の日報`,
      detail: `${report.author}さんが記入`,
      time: report.createdAt || 0,
    });
  });
  state.sales
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2)
    .forEach((sale) => {
      activities.push({
        type: "sale",
        title: `${formatDate(sale.date)}の売上`,
        detail: `${yen.format(saleTotal(sale))}を記録`,
        time: new Date(`${sale.date}T20:00:00`).getTime(),
      });
    });

  document.querySelector("#activity-list").innerHTML = activities
    .sort((a, b) => b.time - a.time)
    .slice(0, 3)
    .map(
      (item) => `
        <div class="activity-item">
          <span class="activity-icon ${item.type}">${item.type === "report" ? "日" : "¥"}</span>
          <span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.detail)}</small>
          </span>
          <span class="activity-time">${item.type === "report" ? "日報" : "売上"}</span>
        </div>
      `,
    )
    .join("");
};

const renderReports = () => {
  const reports = [...state.reports].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0),
  );
  const container = document.querySelector("#report-list");
  if (!reports.length) {
    container.innerHTML = '<div class="empty-message">まだ日報がありません。</div>';
    return;
  }

  container.innerHTML = reports
    .slice(0, 6)
    .map(
      (report) => `
        <article class="record-card">
          <div class="record-card-top">
            <strong>${formatDate(report.date)}</strong>
            <span class="weather-tag">${escapeHtml(report.weather)}</span>
          </div>
          <p>${escapeHtml(report.note)}</p>
          <div class="record-meta">
            <span>記入：${escapeHtml(report.author)}</span>
            <span>${Number(report.guests).toLocaleString("ja-JP")}名</span>
          </div>
        </article>
      `,
    )
    .join("");
};

const renderSales = () => {
  const sales = [...state.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  document.querySelector("#sales-table-body").innerHTML = sales
    .map(
      (sale) => `
        <tr>
          <td>${formatDate(sale.date)}</td>
          <td>${yen.format(sale.cash)}</td>
          <td>${yen.format(sale.card)}</td>
          <td>${yen.format(sale.delivery)}</td>
          <td>${yen.format(saleTotal(sale))}</td>
        </tr>
      `,
    )
    .join("");
};

const itemInitial = (category) => {
  const initials = {
    野菜: "菜",
    "肉・魚": "肉",
    乳製品: "乳",
    調味料: "味",
    飲料: "飲",
    その他: "他",
  };
  return initials[category] || "食";
};

const renderInventory = () => {
  const search = document.querySelector("#inventory-search").value.trim().toLowerCase();
  const filtered = state.inventory.filter((item) => {
    const low = item.quantity <= item.threshold;
    const matchesFilter =
      inventoryFilter === "all" || (inventoryFilter === "low" ? low : !low);
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });

  document.querySelector("#inventory-total-count").textContent = state.inventory.length;
  const lowCount = state.inventory.filter((item) => item.quantity <= item.threshold).length;
  document.querySelector("#inventory-low-count").textContent = lowCount;
  document.querySelector("#inventory-good-count").textContent = state.inventory.length - lowCount;

  const body = document.querySelector("#inventory-table-body");
  if (!filtered.length) {
    body.innerHTML =
      '<tr><td colspan="6"><div class="empty-message">条件に合う食材がありません。</div></td></tr>';
    return;
  }

  body.innerHTML = filtered
    .map((item) => {
      const low = item.quantity <= item.threshold;
      return `
        <tr>
          <td>
            <span class="ingredient-name">
              <span class="ingredient-avatar">${itemInitial(item.category)}</span>
              ${escapeHtml(item.name)}
            </span>
          </td>
          <td>${escapeHtml(item.category)}</td>
          <td><strong>${item.quantity}</strong> ${escapeHtml(item.unit)}</td>
          <td>${item.threshold} ${escapeHtml(item.unit)}</td>
          <td><span class="stock-status ${low ? "low" : "good"}">${low ? "要発注" : "在庫あり"}</span></td>
          <td>
            <span class="quantity-control">
              <button type="button" data-item-id="${item.id}" data-change="-1" aria-label="${escapeHtml(item.name)}を減らす">−</button>
              <span>1</span>
              <button type="button" data-item-id="${item.id}" data-change="1" aria-label="${escapeHtml(item.name)}を増やす">＋</button>
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
};

const renderAll = () => {
  renderMetrics();
  renderChart();
  renderDashboardAlerts();
  renderActivities();
  renderReports();
  renderSales();
  renderInventory();
};

const navigate = (target) => {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === target);
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === target);
  });

  const titles = {
    dashboard: "おはようございます",
    reports: "営業の記録",
    sales: "お金の記録",
    inventory: "食材の記録",
  };
  document.querySelector("#page-title").textContent = titles[target] || "MiseNote";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

document.querySelectorAll("[data-target]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    navigate(element.dataset.target);
  });
});

document.querySelector("#report-note").addEventListener("input", (event) => {
  document.querySelector("#report-char-count").textContent = event.target.value.length;
});

document.querySelector("#report-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const report = {
    id: Date.now(),
    date: document.querySelector("#report-date").value,
    author: document.querySelector("#report-author").value.trim(),
    weather: document.querySelector("#report-weather").value,
    guests: Number(document.querySelector("#report-guests").value),
    note: document.querySelector("#report-note").value.trim(),
    handover: document.querySelector("#report-handover").value.trim(),
    createdAt: Date.now(),
  };

  const existingIndex = state.reports.findIndex((item) => item.date === report.date);
  if (existingIndex >= 0) {
    state.reports[existingIndex] = report;
  } else {
    state.reports.unshift(report);
  }
  saveState();
  renderAll();
  showToast("日報を保存しました");
  document.querySelector("#report-note").value = "";
  document.querySelector("#report-handover").value = "";
  document.querySelector("#report-char-count").textContent = "0";
});

const calculateLiveSales = () => {
  const total = [...document.querySelectorAll(".money-input")].reduce(
    (sum, input) => sum + Number(input.value || 0),
    0,
  );
  document.querySelector("#sales-live-total").textContent = yen.format(total);
};

document.querySelectorAll(".money-input").forEach((input) => {
  input.addEventListener("input", calculateLiveSales);
});

document.querySelector("#sales-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const sale = {
    date: document.querySelector("#sales-date").value,
    cash: Number(document.querySelector("#sales-cash").value || 0),
    card: Number(document.querySelector("#sales-card").value || 0),
    delivery: Number(document.querySelector("#sales-delivery").value || 0),
    other: Number(document.querySelector("#sales-other").value || 0),
  };
  const existingIndex = state.sales.findIndex((item) => item.date === sale.date);
  if (existingIndex >= 0) {
    state.sales[existingIndex] = sale;
  } else {
    state.sales.push(sale);
  }
  state.sales.sort((a, b) => a.date.localeCompare(b.date));
  saveState();
  renderAll();
  showToast("売上を保存しました");
});

document.querySelector("#inventory-search").addEventListener("input", renderInventory);

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    inventoryFilter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderInventory();
  });
});

document.querySelector("#inventory-table-body").addEventListener("click", (event) => {
  const button = event.target.closest("[data-item-id]");
  if (!button) return;
  const item = state.inventory.find((entry) => entry.id === Number(button.dataset.itemId));
  if (!item) return;
  item.quantity = Math.max(0, Math.round((item.quantity + Number(button.dataset.change)) * 10) / 10);
  saveState();
  renderAll();
  showToast(`${item.name}の在庫を ${item.quantity}${item.unit} に更新しました`);
});

const itemDialog = document.querySelector("#item-dialog");
document.querySelector("#open-item-dialog").addEventListener("click", () => itemDialog.showModal());
document.querySelector("#close-item-dialog").addEventListener("click", () => itemDialog.close());
document.querySelector("#cancel-item-dialog").addEventListener("click", () => itemDialog.close());

document.querySelector("#item-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const item = {
    id: Date.now(),
    name: document.querySelector("#item-name").value.trim(),
    category: document.querySelector("#item-category").value,
    unit: document.querySelector("#item-unit").value,
    quantity: Number(document.querySelector("#item-quantity").value),
    threshold: Number(document.querySelector("#item-threshold").value),
  };
  state.inventory.push(item);
  saveState();
  renderAll();
  itemDialog.close();
  event.target.reset();
  document.querySelector("#item-quantity").value = 10;
  document.querySelector("#item-threshold").value = 5;
  showToast(`${item.name}を在庫に追加しました`);
});

document.querySelector("#notification-button").addEventListener("click", () => {
  const lowCount = state.inventory.filter((item) => item.quantity <= item.threshold).length;
  showToast(
    lowCount
      ? `発注を確認したい食材が ${lowCount} 品目あります`
      : "新しいお知らせはありません",
  );
});

const setupIphoneInstallGuide = () => {
  const isIphoneOrIpad =
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isWebAddress = location.protocol === "https:" || location.hostname === "localhost";
  const wasDismissed = localStorage.getItem("misenote-install-guide-dismissed") === "true";
  const guide = document.querySelector("#ios-install-guide");

  if (isIphoneOrIpad && !isStandalone && isWebAddress && !wasDismissed) {
    guide.hidden = false;
  }

  document.querySelector("#dismiss-install-guide").addEventListener("click", () => {
    guide.hidden = true;
    localStorage.setItem("misenote-install-guide-dismissed", "true");
  });
};

const registerOfflineSupport = () => {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.warn("オフライン機能を開始できませんでした。", error);
    }
  });
};

updateDateLabels();
calculateLiveSales();
renderAll();
setupIphoneInstallGuide();
registerOfflineSupport();
