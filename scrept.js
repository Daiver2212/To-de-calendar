document.addEventListener("DOMContentLoaded", () => {

  /* ================= ЧАСЫ ================= */
  startClock();
  function startClock() {
    const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    const weekdays = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

    const hhEl = document.querySelector(".HH");
    const mmEl = document.querySelector(".MM");
    const dateEl = document.querySelector(".date");

    function tick() {
      const now = new Date();
      if (hhEl) hhEl.textContent = String(now.getHours()).padStart(2, "0");
      if (mmEl) mmEl.textContent = String(now.getMinutes()).padStart(2, "0");
      if (dateEl) dateEl.textContent = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
      setTimeout(tick, 1000 - now.getMilliseconds());
    }
    tick();
  }

  /* ================= FIREBASE ================= */
  const firebaseConfig = {
    apiKey: "AIzaSyCqhc22NWeYrbm8c461Bnio4-Nj6r1Zs58",
    authDomain: "to-do-calendar-7a21d.firebaseapp.com",
    projectId: "to-do-calendar-7a21d",
    storageBucket: "to-do-calendar-7a21d.firebasestorage.app",
    messagingSenderId: "334708917123",
    appId: "1:334708917123:web:799c27d742ee4d5cd26cb6"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ================= UI ================= */
  const registerSection = document.getElementById("registerSection"); // можно оставить, мы его спрячем
  const appSection = document.getElementById("appSection");

  const taskName = document.getElementById("taskName");
  const taskDate = document.getElementById("taskDate");
  const taskTime = document.getElementById("taskTime");
  const addBtn = document.querySelector(".add_task");
  const list = document.querySelector(".task_list");
  const clearBtn = document.getElementById("clearAllTasks");

  // ввод даты: ДДММ -> ДД.ММ (без двойных точек)
  taskDate?.addEventListener("input", () => {
    let digits = (taskDate.value || "").replace(/\D/g, "");
    if (digits.length > 4) digits = digits.slice(0, 4);
    taskDate.value = digits.length <= 2 ? digits : digits.slice(0, 2) + "." + digits.slice(2);
  });

  /* ================= AUTH: Anonymous (авто-вход) ================= */
  let uid = null;
  let unsubscribe = null;

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      try {
        await auth.signInAnonymously();
      } catch (e) {
        console.error(e);
        alert("Не удалось войти анонимно. Включи Anonymous в Firebase Auth.");
      }
      return;
    }

    uid = user.uid;

    // скрываем регистрацию (если она есть) и показываем приложение
    registerSection?.classList.add("hidden");
    appSection?.classList.remove("hidden");

    startRealtimeTasks(uid);
  });

  /* ================= FIRESTORE: tasks (у каждого свои) ================= */
  function startRealtimeTasks(uid) {
    if (unsubscribe) unsubscribe();

    const tasksRef = db.collection("users").doc(uid).collection("tasks");

    unsubscribe = tasksRef
      .orderBy("createdAt", "asc")
      .onSnapshot((snap) => {
        list.innerHTML = "";
        snap.forEach((doc) => list.appendChild(createTaskElement(tasksRef, doc.id, doc.data())));
      }, (err) => {
        console.error(err);
        alert("Ошибка Firestore. Проверь Rules.");
      });
  }

  addBtn?.addEventListener("click", async () => {
    if (!uid) return;

    const name = (taskName.value || "").trim();
    if (!name) return;

    // ⏰ время обязательно и первое
    const time = normalizeTime(taskTime.value);
    const date = normalizeDateNoYear(taskDate.value);

    if (!time) {
      alert("Укажи время (например 14:30)");
      return;
    }
    if ((taskDate.value || "").trim() && !date) {
      alert("Неверная дата. Формат: ДД.ММ (например 12.03)");
      return;
    }

    const tasksRef = db.collection("users").doc(uid).collection("tasks");

    try {
      await tasksRef.add({
        name,
        time,
        date: date || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      taskName.value = "";
      taskTime.value = "";
      taskDate.value = "";
      taskName.focus();
    } catch (e) {
      console.error(e);
      alert("Ошибка сохранения задачи");
    }
  });

  function createTaskElement(tasksRef, docId, task) {
    const el = document.createElement("div");
    el.className = "task";

    const when = `${task.time || ""} ${task.date || ""}`.trim();

    el.innerHTML = `
      <div class="checkbox"></div>
      <div class="content">
        <h2 class="task__name">${escapeHtml(task.name || "")}</h2>
        <span class="condition inprocess">${escapeHtml(when || "—")}</span>
      </div>
    `;

    // удалить по клику на кружок
    el.querySelector(".checkbox").addEventListener("click", async () => {
      try {
        await tasksRef.doc(docId).delete();
        el.remove();
      } catch (e) {
        console.error(e);
        alert("Ошибка удаления");
      }
    });

    return el;
  }

  clearBtn?.addEventListener("click", async () => {
    if (!uid) return;
    if (!confirm("Ты точно хочешь удалить ВСЕ задачи?")) return;

    const tasksRef = db.collection("users").doc(uid).collection("tasks");

    try {
      const snap = await tasksRef.get();
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } catch (e) {
      console.error(e);
      alert("Ошибка при удалении задач");
    }
  });

  /* ================= VALIDATION ================= */
  function normalizeDateNoYear(str) {
    const digits = (str || "").replace(/\D/g, "");
    if (digits.length < 4) return "";

    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));

    if (month < 1 || month > 12) return "";
    if (day < 1) return "";

    const year = new Date().getFullYear();
    const max = new Date(year, month, 0).getDate();
    if (day > max) return "";

    return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}`;
  }

  function normalizeTime(str) {
    const s = (str || "").trim();
    if (!s) return "";

    // принимает HH:MM или HH:MM:SS
    const parts = s.split(":");
    if (parts.length < 2) return "";

    const hh = Number(parts[0]);
    const mm = Number(parts[1]);

    if (hh < 0 || hh > 23) return "";
    if (mm < 0 || mm > 59) return "";

    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

});
