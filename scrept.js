document.addEventListener("DOMContentLoaded", () => {

  // ====== EMAILJS (необязательно для работы ToDo) ======
  const EMAILJS_PUBLIC_KEY = "JO8EorPh9Cqh-MWpD";
  const EMAILJS_SERVICE_ID = "service_lkudx7c";
  const EMAILJS_TEMPLATE_ID = "template_v1b21uz";

  const keysNotSet =
    EMAILJS_PUBLIC_KEY === "JO8EorPh9Cqh-MWpD" ||
    EMAILJS_SERVICE_ID === "service_lkudx7c" ||
    EMAILJS_TEMPLATE_ID === "template_v1b21uz";

  if (window.emailjs && !keysNotSet) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // ====== ЧАСЫ (ЗАПУСКАЕМ СРАЗУ, ВСЕГДА) ======
  startClock();

  function startClock() {
    const months = [
      "января","февраля","марта","апреля","мая","июня",
      "июля","августа","сентября","октября","ноября","декабря"
    ];
    const weekdays = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

    const hhEl = document.querySelector(".HH");
    const mmEl = document.querySelector(".MM");
    const blinkEl = document.querySelector(".Blink");
    const dateEl = document.querySelector(".date");

    function tick() {
      const now = new Date();

      if (hhEl) hhEl.textContent = String(now.getHours()).padStart(2, "0");
      if (mmEl) mmEl.textContent = String(now.getMinutes()).padStart(2, "0");
      if (blinkEl) blinkEl.classList.toggle("hidden");

      if (dateEl) {
        dateEl.textContent = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
      }

      setTimeout(tick, 1000 - now.getMilliseconds());
    }

    tick();
  }

  // ====== РЕГИСТРАЦИЯ (ТОЛЬКО EMAIL) ======
  const registerSection = document.getElementById("registerSection");
  const appSection = document.getElementById("appSection");

  const regEmailEl = document.getElementById("regEmail");
  const registerBtn = document.getElementById("registerBtn");
  const registerStatus = document.getElementById("registerStatus");

  // Если уже зарегистрирован — скрываем форму и показываем ToDo
  const savedEmail = localStorage.getItem("registeredEmail");
  if (savedEmail) {
    registerSection.classList.add("hidden");
    appSection.classList.remove("hidden");
  }

  registerBtn.addEventListener("click", () => {
    const email = (regEmailEl.value || "").trim();

    if (!isValidEmail(email)) {
      registerStatus.textContent = "Введи нормальную почту (например name@gmail.com)";
      return;
    }

    registerStatus.textContent = "Регистрирую...";

    // Если EmailJS не настроен — просто регистрируем локально
    if (!window.emailjs || keysNotSet) {
      localStorage.setItem("registeredEmail", email);
      registerStatus.textContent = "Готово! (письмо не отправлено — EmailJS не настроен)";
      registerSection.classList.add("hidden");
      appSection.classList.remove("hidden");
      return;
    }

    // Отправляем письмо
    emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { email: email } // в шаблоне {{email}}
    ).then(
      () => {
        localStorage.setItem("registeredEmail", email);
        registerStatus.textContent = "Письмо отправлено! Проверь почту 📩";
        registerSection.classList.add("hidden");
        appSection.classList.remove("hidden");
      },
      (error) => {
        console.error(error);
        registerStatus.textContent = "Ошибка отправки. Проверь ключи/Service/Template.";
      }
    );
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ====== TODO ======
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

    task.innerHTML = `
      <div class="checkbox" data-checked="false"></div>
      <div class="content">
        <h2 class="task__name">${escapeHtml(name)}</h2>
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
