(function () {
  "use strict";

  const MONTH_NAMES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const TYPE_LABELS = {
    entrenamiento: "Entrenamiento",
    carrera: "Carrera",
    social: "Social"
  };

  let allEvents = [];
  let activeFilter = "all";
  let viewYear, viewMonth; // viewMonth: 0-11

  const calendarGrid = document.getElementById("calendarGrid");
  const monthLabel = document.getElementById("monthLabel");
  const upcomingList = document.getElementById("upcomingList");
  const modalOverlay = document.getElementById("eventModal");
  const modalBody = document.getElementById("modalBody");

  function parseDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function todayKey() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }

  function eventsByDate(dateStr) {
    return allEvents.filter(
      (e) => e.date === dateStr && (activeFilter === "all" || e.type === activeFilter)
    );
  }

  function formatLongDate(dateStr) {
    const d = parseDate(dateStr);
    const weekday = d.toLocaleDateString("es-GT", { weekday: "long" });
    return `${weekday} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
  }

  function renderCalendar() {
    monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    calendarGrid.innerHTML = "";

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    // Convert JS getDay() (0=Sun) to Monday-first index (0=Mon)
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const today = todayKey();

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement("div");
      empty.className = "day-cell empty";
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = eventsByDate(dateStr);

      const cell = document.createElement("div");
      cell.className = "day-cell" + (dayEvents.length ? " has-events" : "") + (dateStr === today ? " today" : "");
      cell.setAttribute("role", "gridcell");

      const num = document.createElement("span");
      num.className = "day-number";
      num.textContent = String(day);
      cell.appendChild(num);

      if (dayEvents.length) {
        const dots = document.createElement("div");
        dots.className = "event-dots";
        dayEvents.forEach((e) => {
          const dot = document.createElement("span");
          dot.className = `dot ${e.type}`;
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
        cell.addEventListener("click", () => openDayEvents(dateStr, dayEvents));
      }

      calendarGrid.appendChild(cell);
    }
  }

  function renderUpcoming() {
    upcomingList.innerHTML = "";
    const today = todayKey();
    const upcoming = allEvents
      .filter((e) => e.date >= today && (activeFilter === "all" || e.type === activeFilter))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 8);

    if (!upcoming.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No hay próximos eventos. Agregá uno en data/events.json.";
      upcomingList.appendChild(empty);
      return;
    }

    upcoming.forEach((e) => {
      const li = document.createElement("li");
      li.className = "upcoming-item";
      li.innerHTML = `
        <div class="u-date">${formatLongDate(e.date)} · ${e.time}</div>
        <div class="u-title">${escapeHtml(e.title)}</div>
        <div class="u-meta">${escapeHtml(e.location)}${e.distance ? " · " + escapeHtml(e.distance) : ""}</div>
        <span class="badge ${e.type}">${TYPE_LABELS[e.type] || e.type}</span>
      `;
      li.addEventListener("click", () => openEventModal(e));
      upcomingList.appendChild(li);
    });
  }

  function openDayEvents(dateStr, dayEvents) {
    if (dayEvents.length === 1) {
      openEventModal(dayEvents[0]);
      return;
    }
    modalBody.innerHTML = `<h3>${formatLongDate(dateStr)}</h3>`;
    const list = document.createElement("div");
    dayEvents.forEach((e) => {
      const item = document.createElement("div");
      item.className = "upcoming-item";
      item.style.marginBottom = "0.5rem";
      item.innerHTML = `<div class="u-title">${escapeHtml(e.title)}</div>
        <div class="u-meta">${e.time} · ${escapeHtml(e.location)}</div>
        <span class="badge ${e.type}">${TYPE_LABELS[e.type] || e.type}</span>`;
      item.addEventListener("click", () => openEventModal(e));
      list.appendChild(item);
    });
    modalBody.appendChild(list);
    showModal();
  }

  function openEventModal(e) {
    modalBody.innerHTML = `
      <span class="badge ${e.type}">${TYPE_LABELS[e.type] || e.type}</span>
      <h3 id="modalTitle">${escapeHtml(e.title)}</h3>
      <div class="modal-meta-row">📅 ${formatLongDate(e.date)} · ${e.time}</div>
      <div class="modal-meta-row">📍 ${
        e.locationUrl
          ? `<a href="${escapeAttr(e.locationUrl)}" target="_blank" rel="noopener">${escapeHtml(e.location)}</a>`
          : escapeHtml(e.location)
      }</div>
      ${e.distance ? `<div class="modal-meta-row">📏 ${escapeHtml(e.distance)}</div>` : ""}
      ${e.description ? `<p class="modal-desc">${escapeHtml(e.description)}</p>` : ""}
      <div class="modal-actions">
        <button class="btn btn-primary" id="icsBtn">Agregar a mi calendario</button>
        ${
          e.link
            ? `<a class="btn btn-secondary" href="${escapeAttr(e.link)}" target="_blank" rel="noopener">Más info</a>`
            : ""
        }
      </div>
    `;
    document.getElementById("icsBtn").addEventListener("click", () => downloadIcs(e));
    showModal();
  }

  function showModal() {
    modalOverlay.classList.remove("hidden");
    modalOverlay.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
  }

  function downloadIcs(e) {
    const [h, m] = e.time.split(":").map(Number);
    const start = parseDate(e.date);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const fmt = (d) =>
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(
        d.getHours()
      ).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Altura Athletics//ES",
      "BEGIN:VEVENT",
      `UID:${e.id}@altura-athletics`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${e.title}`,
      `LOCATION:${e.location}`,
      `DESCRIPTION:${(e.description || "").replace(/\n/g, "\\n")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${e.id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function setupFilters() {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.dataset.type;
        renderCalendar();
        renderUpcoming();
      });
    });
  }

  function setupNav() {
    document.getElementById("prevMonth").addEventListener("click", () => {
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      renderCalendar();
    });
    document.getElementById("nextMonth").addEventListener("click", () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      renderCalendar();
    });
    document.getElementById("modalClose").addEventListener("click", hideModal);
    modalOverlay.addEventListener("click", (ev) => {
      if (ev.target === modalOverlay) hideModal();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") hideModal();
    });
  }

  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    setupFilters();
    setupNav();

    fetch("data/events.json")
      .then((res) => res.json())
      .then((data) => {
        allEvents = data;
        renderCalendar();
        renderUpcoming();
      })
      .catch((err) => {
        console.error("No se pudieron cargar los eventos:", err);
        upcomingList.innerHTML = '<li class="empty-state">Error al cargar data/events.json</li>';
      });
  }

  init();
})();
