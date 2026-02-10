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
  modal.addEventListener("click", e => {
    if (e.target.dataset.close === "1") closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  let tasks = loadTasks();
  renderAll();

  /* автоточка в дате */
  taskDate.addEventListener("input", () => {
    let v = taskDate.value.replace(/[^\d.]/g, "");
    if (v.length === 2 && !v.includes(".")) v += ".";
    if (v.length > 5) v = v.slice(0, 5);
    taskDate.value = v;
  });

  addBtn.addEventListener("click", () => {
    const name = taskName.value.trim();
    if (!name) return;

    const date = normalizeDateNoYear(taskDate.value);
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

    const when = `${task.date} ${task.time}`.trim();

    el.innerHTML = `
      <div class="checkbox"></div>
      <div class="content">
        <h2 class="task__name">${escapeHtml(task.name)}</h2>
        <span class="condition inprocess">${escapeHtml(when)}</span>
      </div>
    `;

    el.querySelector(".content").addEventListener("click", () => openModal(task));

    el.querySelector(".checkbox").addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks(tasks);
      el.remove();
    });

    return el;
  }

  function renderAll() {
    list.innerHTML = "";
    tasks.forEach(t => list.appendChild(createTask(t)));
  }

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

  /* ===== НОРМАЛИЗАЦИЯ ДАТЫ (ИСПРАВЛЕНО) ===== */
  function normalizeDateNoYear(str) {
    const s = (str || "").trim();
    if (!s) return "";

    const m = s.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (!m) return "";

    const d = Number(m[1]);
    const mo = Number(m[2]);
    if (d < 1 || d > 31 || mo < 1 || mo > 12) return "";

    return String(d).padStart(2, "0") + "." + String(mo).padStart(2, "0");
  }

  /* ===== localStorage ===== */
  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem("tasks")) || [];
    } catch {
      return [];
    }
  }

  function saveTasks(arr) {
    localStorage.setItem("tasks", JSON.stringify(arr));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

});
