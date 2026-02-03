document.addEventListener("DOMContentLoaded", () => {

  // ===== ЧАСЫ =====
  startClock();

  function startClock() {
    const months = [
      "января","февраля","марта","апреля","мая","июня",
      "июля","августа","сентября","октября","ноября","декабря"
    ];
    const weekdays = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

    const hhEl = document.querySelector(".HH");
    const mmEl = document.querySelector(".MM");
    const dateEl = document.querySelector(".date");

    function tick() {
      const now = new Date();

      if (hhEl) hhEl.textContent = String(now.getHours()).padStart(2, "0");
      if (mmEl) mmEl.textContent = String(now.getMinutes()).padStart(2, "0");

      if (dateEl) {
        dateEl.textContent =
          `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
      }

      setTimeout(tick, 1000 - now.getMilliseconds());
    }

    tick();
  }

  // ===== РЕГИСТРАЦИЯ =====
  const registerSection = document.getElementById("registerSection");
  const appSection = document.getElementById("appSection");
  const regEmail = document.getElementById("regEmail");
  const registerBtn = document.getElementById("registerBtn");
  const registerStatus = document.getElementById("registerStatus");

  const savedEmail = localStorage.getItem("registeredEmail");
  if (savedEmail) {
    registerSection.classList.add("hidden");
    appSection.classList.remove("hidden");
  }

  registerBtn.addEventListener("click", () => {
    const email = (regEmail.value || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (registerStatus) registerStatus.textContent = "Введи корректный email";
      return;
    }

    localStorage.setItem("registeredEmail", email);

    if (registerStatus) registerStatus.textContent = "Готово ✅";
    registerSection.classList.add("hidden");
    appSection.classList.remove("hidden");
  });

  // ===== TODO + localStorage =====
  const addBtn = document.querySelector(".add_task");
  const list = document.querySelector(".task_list");
  const taskName = document.getElementById("taskName");
  const taskDate = document.getElementById("taskDate"); // ДД.ММ
  const taskTime = document.getElementById("taskTime");
  const clearBtn = document.getElementById("clearAllTasks");

  let tasks = loadTasks();
  renderAll();

  // автоподстановка точки: "12" -> "12."
  taskDate.addEventListener("input", () => {
    let v = taskDate.value.replace(/[^\d.]/g, "");
    if (v.length === 2 && !v.includes(".")) v = v + ".";
    if (v.length > 5) v = v.slice(0, 5);
    taskDate.value = v;
  });

  addBtn.addEventListener("click", () => {
    const name = (taskName.value || "").trim();
    if (!name) return;

    const date = normalizeDateNoYear(taskDate.value);
    const time = (taskTime.value || "").trim();

    const task = {
      id: Date.now().toString(),
      name,
      date, // "ДД.ММ" или ""
      time  // "HH:MM" или ""
    };

    tasks.push(task);
    saveTasks(tasks);

    list.appendChild(createTaskElement(task));

    taskName.value = "";
    taskDate.value = "";
    taskTime.value = "";
    taskName.focus();
  });

  function createTaskElement(task) {
    const el = document.createElement("div");
    el.className = "task";
    el.dataset.id = task.id;

    const whenText = `${task.date} ${task.time}`.trim();

    el.innerHTML = `
      <div class="checkbox" data-checked="false"></div>
      <div class="content">
        <h2 class="task__name">${escapeHtml(task.name)}</h2>
        <span class="condition inprocess">${escapeHtml(whenText)}</span>
      </div>
    `;

    const checkbox = el.querySelector(".checkbox");
    checkbox.addEventListener("click", () => {
      if (checkbox.dataset.checked === "true") return;
      checkbox.dataset.checked = "true";
      checkbox.textContent = "✓";

      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks(tasks);

      setTimeout(() => el.remove(), 500);
    });

    return el;
  }

  function renderAll() {
    list.innerHTML = "";
    tasks.forEach(t => list.appendChild(createTaskElement(t)));
  }

  // ===== КНОПКА "УДАЛИТЬ ВСЕ" =====
  clearBtn.addEventListener("click", () => {
    if (!tasks.length) {
      alert("Задач нет 🙂");
      return;
    }
    if (!confirm("Ты точно хочешь удалить ВСЕ задачи?")) return;

    tasks = [];
    saveTasks(tasks);
    list.innerHTML = "";
  });

  // ===== ДАТА БЕЗ ГОДА (ДД.ММ) =====
  function normalizeDateNoYear(str) {
    const s = (str || "").trim();
    if (!s) return "";

    const m = s.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (!m) return "";

    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");

    const d = Number(day);
    const mo = Number(month);

    if (d < 1 || d > 31 || mo < 1 || mo > 12) return "";
    return `${day}.${month}`;
  }

  // ===== localStorage helpers =====
  function loadTasks() {
    try {
      const raw = localStorage.getItem("tasks");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveTasks(arr) {
    localStorage.setItem("tasks", JSON.stringify(arr));
  }

  // ===== защита =====
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
