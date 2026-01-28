document.addEventListener("DOMContentLoaded", () => {

  // ===== ЧАСЫ И ДАТА =====
  const months = [
    "января","февраля","марта","апреля","мая","июня",
    "июля","августа","сентября","октября","ноября","декабря"
  ];
  const weekdays = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

  const hhEl = document.querySelector(".HH");
  const mmEl = document.querySelector(".MM");
  const blinkEl = document.querySelector(".Blink");
  const dateEl = document.querySelector(".date");

  function updateClock() {
    const now = new Date();

    hhEl.textContent = String(now.getHours()).padStart(2, "0");
    mmEl.textContent = String(now.getMinutes()).padStart(2, "0");

    blinkEl.classList.toggle("hidden");

    dateEl.textContent = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }

  updateClock();
  setInterval(updateClock, 500);

  // ===== ДОБАВЛЕНИЕ ЗАДАЧ =====
  const addBtn = document.querySelector(".add_task");
  const listEl = document.querySelector(".task_list");

  const taskNameEl = document.getElementById("taskName");
  const taskDateEl = document.getElementById("taskDate");
  const taskTimeEl = document.getElementById("taskTime");

  addBtn.addEventListener("click", () => {
    const name = (taskNameEl.value || "").trim();
    const date = taskDateEl.value || "";
    const time = taskTimeEl.value || "";

    if (!name) return;

    listEl.appendChild(makeTaskElement(name, date, time));

    taskNameEl.value = "";
    taskDateEl.value = "";
    taskTimeEl.value = "";
    taskNameEl.focus();
  });

  function makeTaskElement(name, date, time) {
    const task = document.createElement("div");
    task.className = "task";

    const safeName = escapeHtml(name);

    task.innerHTML = `
      <div class="checkbox" data-checked="false"></div>
      <div class="content">
        <h2 class="task__name">${safeName}</h2>
        <span class="condition inprocess">${(date + " " + time).trim()}</span>
      </div>
    `;

    const checkbox = task.querySelector(".checkbox");
    checkbox.addEventListener("click", () => {
      if (checkbox.dataset.checked === "true") return;

      checkbox.dataset.checked = "true";
      checkbox.textContent = "✓";
      setTimeout(() => task.remove(), 1200);
    });

    return task;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
