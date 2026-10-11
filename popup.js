const $ = (id) => document.getElementById(id);

async function refresh() {
  const { session, student, queue = [], recent = [], lastUpload } =
    await chrome.storage.local.get(["session", "student", "queue", "recent", "lastUpload"]);

  const status = $("status");
  if (session && session.active) {
    status.className = "status on";
    status.textContent = `Proctoring ACTIVE: ${session.count || 0} flag(s) this session.`;
  } else {
    status.className = "status";
    status.textContent = "Idle. Proctoring starts automatically when you open a proctored Google Form quiz.";
  }

  const up = $("upload");
  if (lastUpload) {
    up.className = "status" + (lastUpload.ok ? " on" : "");
    up.style.background = lastUpload.ok ? "" : "#fee2e2";
    up.textContent = `Last upload (${new Date(lastUpload.ts).toLocaleTimeString()}): ${lastUpload.message}`;
  }

  if (student) { $("name").value = student.name || ""; $("sid").value = student.id || ""; }

  const list = $("recent");
  list.textContent = "";
  if (!recent.length) {
    const li = document.createElement("li");
    li.textContent = "No flags yet.";
    list.appendChild(li);
  }
  for (const r of recent) {
    const li = document.createElement("li");
    li.textContent = `${r.date} ${r.time} · ${r.type.replace(/_/g, " ")}`;
    list.appendChild(li);
  }

  $("pending").textContent = queue.length ? `${queue.length} entr${queue.length === 1 ? "y" : "ies"} waiting to upload.` : "";

  try { $("warnFile").style.display = (await chrome.extension.isAllowedFileSchemeAccess()) ? "none" : "block"; } catch {}
  try { $("warnIncog").style.display = (await chrome.extension.isAllowedIncognitoAccess()) ? "none" : "block"; } catch {}
}

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ student: { name: $("name").value.trim(), id: $("sid").value.trim() } });
  $("saved").textContent = " Saved ✓";
  setTimeout(() => ($("saved").textContent = ""), 2000);
});

$("sync").addEventListener("click", async () => {
  $("sync").disabled = true;
  await chrome.runtime.sendMessage({ type: "FLUSH" }).catch(() => {});
  $("sync").disabled = false;
  refresh();
});

refresh();
