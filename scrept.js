document.addEventListener("DOMContentLoaded", () => {

  /* ===== ЧАСЫ ===== */
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

  /* ===== РЕГИСТРАЦИЯ (localStorage) ===== */
  const registerSection = document.getElementById("registerSection");
  const appSection = document.getElementById("appSection");
  const regEmail = document.getElementById("regEmail");
  const registerBtn = document.getElementById("registerBtn");
  const registerStatus = document.getElementById("registerStatus");

  if (localStorage.getItem("registeredEmail")) {
    registerSection.classList.add("hidden");
    appSection.classList.remove("hidden");
  }

  registerBtn.addEventListener("click", () => {
    const email = (regEmail.value || "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      registerStatus.textContent = "Введи корректный email";
      return;
    }

    localStorage.setItem("registeredEmail", email);
    registerStatus.textContent = "Готово ✅";
    registerSection.classList.add("hidden");
    appSection.classList.remove("hidden");
  });

  /* ===== TODO ===== */
  const addBtn = document.querySelector(".add_task");
  const list = document.querySelector(".task_list");
  const taskName = document.getElementById("taskName");
  const taskDate = document.getElementById("taskDate");
  const taskTime = document.getElementById("taskTime");
  const clearBtn = document.getElementById("clearAllTasks");

  /* ===== MODAL ===== */
  const modal = document.getElementById("taskModal");
  const modalName = document.getElementById("modalName");
  const modalDate = document.getElementById("modalDate");
  const modalTime = document.getElementById("modalTime");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  function openModal(task) {
    modalName.textContent = task.name || "—";
    modalDate.textContent = task.date || "—";
    modalTime.textContent = task.time || "—";
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target && e.target.dataset && e.target.dataset.close === "1") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });

  /* ===== ЗАГРУЗКА ЗАДАЧ ===== */
  let tasks = loadTasks();
  renderAll();

  /* ===== ВВОД ДАТЫ: ДДММ -> ДД.ММ (железно, без двойных точек) ===== */
  taskDate.addEventListener("input", () => {
    let digits = (taskDate.value || "").replace(/\D/g, ""); // только цифры
    if (digits.length > 4) digits = digits.slice(0, 4);

    if (digits.length <= 2) {
      taskDate.value = digits;
    } else {
      taskDate.value = digits.slice(0, 2) + "." + digits.slice(2);
    }
  });

  /* ===== ДОБАВИТЬ ЗАДАЧУ ===== */
  addBtn.addEventListener("click", () => {
    const name = (taskName.value || "").trim();
    if (!name) return;

    const date = normalizeDateNoYear(taskDate.value); // вернёт "ДД.ММ" или ""
    const time = (taskTime.value || "").trim();

    const task = {
      id: Date.now().toString(),
      name,
      date,
      time
    };

    tasks.push(task);
    saveTasks(tasks);

    list.appendChild(createTask(task));

    taskName.value = "";
    taskDate.value = "";
    taskTime.value = "";
    taskName.focus();
  });

  function createTask(task) {
    const el = document.createElement("div");
    el.className = "task";
    el.dataset.id = task.id;

    const when = `${task.date} ${task.time}`.trim();

    el.innerHTML = `
      <div class="checkbox" data-checked="false"></div>
      <div class="content">
        <h2 class="task__name">${escapeHtml(task.name)}</h2>
        <span class="condition inprocess">${escapeHtml(when)}</span>
      </div>
    `;

    // клик по задаче -> модалка
    el.querySelector(".content").addEventListener("click", () => openModal(task));

    // клик по кружочку -> удалить
    const checkbox = el.querySelector(".checkbox");
    checkbox.addEventListener("click", () => {
      if (checkbox.dataset.checked === "true") return;
      checkbox.dataset.checked = "true";
      checkbox.textContent = "✓";

      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks(tasks);

      setTimeout(() => el.remove(), 350);
    });

    return el;
  }

  function renderAll() {
    list.innerHTML = "";
    tasks.forEach(t => list.appendChild(createTask(t)));
  }

  /* ===== УДАЛИТЬ ВСЕ ===== */
  clearBtn.addEventListener("click", () => {
    if (!tasks.length) {
      alert("Задач нет 🙂");
      return;
    }
    if (!confirm("Удалить все задачи?")) return;

    tasks = [];
    saveTasks(tasks);
    list.innerHTML = "";
  });

  /* ===== НОРМАЛИЗАЦИЯ ДАТЫ (принимает 12.3 / 1203 / 12/03 и т.д.) ===== */
  function normalizeDateNoYear(str) {
    const digits = (str || "").replace(/\D/g, "");
    if (!digits) return "";

    // нужно ровно 4 цифры: ДДММ
    if (digits.length < 4) return "";

    const d = Number(digits.slice(0, 2));
    const m = Number(digits.slice(2, 4));

    if (!Number.isFinite(d) || !Number.isFinite(m)) return "";
    if (d < 1 || d > 31 || m < 1 || m > 12) return "";

    return String(d).padStart(2, "0") + "." + String(m).padStart(2, "0");
  }

  /* ===== localStorage ===== */
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

  /* ===== защита ===== */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
