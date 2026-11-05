const $ = (id) => document.getElementById(id);

const sentenceSet = [
  "작은 습관이 모여 어제보다 나은 오늘을 만듭니다.",
  "천천히 입력해도 괜찮아요. 정확한 타이핑이 먼저입니다.",
  "좋아하는 음악을 들으며 나만의 속도로 연습해 보세요.",
  "꾸준함은 특별한 재능보다 더 멀리 데려다줍니다.",
  "새로운 것을 배우는 일은 언제나 작은 시작에서 출발합니다."
];
const paragraphSet = [
  "아침 햇살이 창가에 내려앉았다. 책상 위에 놓인 노트와 펜을 정리하고 오늘 해야 할 일을 하나씩 적어 본다. 서두르지 않고 차근차근 해 나가면 생각보다 많은 일을 해낼 수 있다.",
  "기록은 순간을 오래 간직하는 방법이다. 짧은 문장 하나라도 직접 써 내려가다 보면 생각이 정리되고, 평소에는 지나쳤던 마음의 결도 조금씩 선명해진다. 오늘의 문장을 천천히 완성해 보자."
];
const defaults = {
  bgOpacity: 100, bgBlur: 0, bgDim: 25, fontFamily: "Pretendard, 'Noto Sans KR', sans-serif",
  fontSize: 17, fontWeight: 500, textColor: "#f4f5f7", accentColor: "#a7c7ff",
  inputOpacity: 12, panelBlur: 16, background: ""
};
let settings = {...defaults};
let mode = "sentences", itemIndex = 0, target = sentenceSet[0], startedAt = null, timerId = null;

function loadSettings() {
  try { settings = {...defaults, ...JSON.parse(localStorage.getItem("twc-settings") || "{}")}; } catch {}
  Object.keys(defaults).forEach(key => {
    const el = $(key);
    if (el && key !== "background") el.value = settings[key];
  });
  applySettings();
}
function saveSettings() {
  localStorage.setItem("twc-settings", JSON.stringify(settings));
}
function applySettings() {
  document.documentElement.style.setProperty("--text", settings.textColor);
  document.documentElement.style.setProperty("--accent", settings.accentColor);
  document.documentElement.style.setProperty("--font-family", settings.fontFamily);
  document.documentElement.style.setProperty("--font-size", settings.fontSize + "px");
  document.documentElement.style.setProperty("--font-weight", settings.fontWeight);
  document.documentElement.style.setProperty("--panel-alpha", settings.inputOpacity / 100);
  document.documentElement.style.setProperty("--panel-blur", settings.panelBlur + "px");
  $("backdrop").style.opacity = settings.bgOpacity / 100;
  $("backdrop").style.filter = `blur(${settings.bgBlur}px)`;
  $("backdrop").style.backgroundImage = settings.background ? `url("${settings.background}")` : "none";
  $("shade").style.background = `rgba(5,9,18,${settings.bgDim / 100})`;
  const outputMap = {
    bgOpacity: settings.bgOpacity + "%", bgBlur: settings.bgBlur + "px",
    bgDim: settings.bgDim + "%", fontSize: settings.fontSize + "px",
    fontWeight: settings.fontWeight, inputOpacity: settings.inputOpacity + "%",
    panelBlur: settings.panelBlur + "px"
  };
  Object.entries(outputMap).forEach(([id, value]) => $(id + "Value").textContent = value);
  $("fontFamily").value = settings.fontFamily;
  $("textColor").value = settings.textColor;
  $("accentColor").value = settings.accentColor;
}
function setTarget(next) {
  target = next;
  $("typingInput").value = "";
  $("typingInput").disabled = false;
  $("typingInput").focus();
  startedAt = null;
  clearInterval(timerId);
  timerId = null;
  updateStats();
  renderPassage();
  $("statusMessage").textContent = "준비되면 입력을 시작하세요.";
}
function currentSet() {
  return mode === "paragraph" ? paragraphSet : sentenceSet;
}
function renderPassage() {
  const typed = $("typingInput").value;
  const html = Array.from(target).map((char, i) => {
    let cls = "";
    if (i < typed.length) cls = typed[i] === char ? "correct" : "incorrect";
    else if (i === typed.length) cls = "current";
    return `<span class="${cls}">${escapeHtml(char)}</span>`;
  }).join("");
  $("passage").innerHTML = html;
}
function escapeHtml(s) {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function updateStats() {
  const typed = $("typingInput").value;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const accuracy = typed.length ? Math.round(correct / typed.length * 100) : 100;
  const progress = Math.min(100, Math.round(typed.length / target.length * 100));
  const minutes = startedAt ? Math.max((Date.now() - startedAt) / 60000, 1/60) : 0;
  const wpm = minutes ? Math.round(correct / 5 / minutes) : 0;
  $("wpm").textContent = wpm;
  $("accuracy").textContent = accuracy;
  $("progress").textContent = progress;
  $("progressFill").style.width = progress + "%";
  const seconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  $("elapsed").textContent = String(Math.floor(seconds/60)).padStart(2,"0") + ":" + String(seconds%60).padStart(2,"0");
}
function tick() { updateStats(); }
$("typingInput").addEventListener("input", () => {
  if (!startedAt && $("typingInput").value.length) {
    startedAt = Date.now();
    timerId = setInterval(tick, 500);
  }
  if ($("typingInput").value.length >= target.length && target.length > 0) {
    $("typingInput").value = $("typingInput").value.slice(0, target.length);
    $("typingInput").disabled = true;
    clearInterval(timerId);
    $("statusMessage").textContent = "완료했어요! 다음 문장으로 넘어가 보세요.";
  }
  renderPassage();
  updateStats();
});
function openSettings(open) {
  $("settingsPanel").classList.toggle("open", open);
  $("panelScrim").classList.toggle("show", open);
  $("settingsPanel").setAttribute("aria-hidden", String(!open));
}
$("settingsToggle").addEventListener("click", () => openSettings(true));
$("settingsClose").addEventListener("click", () => openSettings(false));
$("panelScrim").addEventListener("click", () => openSettings(false));
document.querySelectorAll(".mode-tab").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".mode-tab").forEach(b => b.classList.remove("active"));
  button.classList.add("active");
  mode = button.dataset.mode;
  $("modeTitle").textContent = mode === "sentences" ? "문장 연습" : mode === "paragraph" ? "긴 글 연습" : "직접 입력";
  $("customSource").classList.toggle("hidden", mode !== "custom");
  $("passageWrap").classList.toggle("hidden", mode === "custom");
  if (mode === "custom") {
    target = $("customText").value.trim() || "직접 입력 모드입니다. 연습할 글을 입력하고 적용해 주세요.";
    setTarget(target);
  } else {
    itemIndex = 0;
    setTarget(currentSet()[itemIndex]);
  }
}));
$("applyCustom").addEventListener("click", () => {
  const value = $("customText").value.trim();
  if (!value) { $("customText").focus(); return; }
  setTarget(value);
});
$("nextButton").addEventListener("click", () => {
  if (mode === "custom") {
    const value = $("customText").value.trim();
    if (value) setTarget(value);
    else $("customText").focus();
  } else {
    const set = currentSet();
    itemIndex = (itemIndex + 1) % set.length;
    setTarget(set[itemIndex]);
  }
});
$("resetButton").addEventListener("click", () => setTarget(target));
const settingIds = ["bgOpacity","bgBlur","bgDim","fontSize","fontWeight","inputOpacity","panelBlur","fontFamily","textColor","accentColor"];
settingIds.forEach(id => $(id).addEventListener("input", () => {
  settings[id] = ["fontFamily","textColor","accentColor"].includes(id) ? $(id).value : Number($(id).value);
  applySettings();
  saveSettings();
}));
$("backgroundUpload").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { alert("이미지 파일을 선택해 주세요."); return; }
  if (file.size > 5 * 1024 * 1024) { alert("이미지는 5MB 이하 파일을 선택해 주세요."); return; }
  const reader = new FileReader();
  reader.onload = () => { settings.background = reader.result; applySettings(); saveSettings(); };
  reader.readAsDataURL(file);
});
$("removeBackground").addEventListener("click", () => {
  settings.background = ""; $("backgroundUpload").value = ""; applySettings(); saveSettings();
});
$("resetSettings").addEventListener("click", () => {
  settings = {...defaults};
  localStorage.removeItem("twc-settings");
  loadSettings();
});
loadSettings();
setTarget(target);
