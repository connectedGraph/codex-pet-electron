const previewElement = document.querySelector("#previewPet");
const previewPlayer = new window.PetSprite.SpritePlayer(previewElement);
const stateButtons = [...document.querySelectorAll("[data-state]")];
const pauseButton = document.querySelector("#pauseButton");
const visibilityButton = document.querySelector("#visibilityButton");
const resetButton = document.querySelector("#resetButton");
const quitButton = document.querySelector("#quitButton");
const previewStage = document.querySelector("#previewStage");
const stateLabel = document.querySelector("#previewStateLabel");
const frameReadout = document.querySelector("#frameReadout");
const eventLine = document.querySelector("#eventLine");
const atlasButton = document.querySelector("#atlasButton");
const atlasDialog = document.querySelector("#atlasDialog");
const closeAtlasButton = document.querySelector("#closeAtlasButton");
const zoomRange = document.querySelector("#zoomRange");
const zoomOutput = document.querySelector("#zoomOutput");
const atlasImage = document.querySelector("#atlasImage");

let currentState = { state: "idle", paused: false, petVisible: true };

function rowForState(state) {
  const firstFrame = window.PetSprite.states[state].frames[0];
  return firstFrame[0];
}

function syncUi(next) {
  currentState = next;
  previewPlayer.setState(next.state);
  previewPlayer.setPaused(next.paused);

  const config = window.PetSprite.states[next.state];
  stateLabel.textContent = config.label;
  pauseButton.textContent = next.paused ? "继续播放" : "暂停播放";
  visibilityButton.textContent = next.petVisible ? "隐藏悬浮宠物" : "显示悬浮宠物";

  stateButtons.forEach((button) => {
    const selected = button.dataset.state === next.state;
    button.setAttribute("aria-pressed", String(selected));
  });

  eventLine.textContent = `当前状态：${config.label}。悬浮窗${next.petVisible ? "已显示" : "已隐藏"}。`;
}

function updateFrameReadout() {
  const config = window.PetSprite.states[currentState.state];
  const frame = Number(previewElement.dataset.frame || 1);
  frameReadout.textContent = `ROW ${rowForState(currentState.state)} · FRAME ${frame}/${config.frames.length}`;
  window.requestAnimationFrame(updateFrameReadout);
}

stateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.petAPI.setState(button.dataset.state);
  });
});

pauseButton.addEventListener("click", () => window.petAPI.togglePaused());
previewStage.addEventListener("click", () => window.petAPI.togglePaused());
visibilityButton.addEventListener("click", () => window.petAPI.toggleVisibility());
resetButton.addEventListener("click", () => {
  window.petAPI.resetPosition();
  eventLine.textContent = "悬浮宠物已移动到主显示器右下角。";
});
quitButton.addEventListener("click", () => window.petAPI.quit());

atlasButton.addEventListener("click", () => atlasDialog.showModal());
closeAtlasButton.addEventListener("click", () => atlasDialog.close());
atlasDialog.addEventListener("click", (event) => {
  if (event.target === atlasDialog) atlasDialog.close();
});

zoomRange.addEventListener("input", () => {
  const value = `${zoomRange.value}%`;
  atlasImage.style.width = value;
  zoomOutput.textContent = value;
});

window.petAPI.onState(syncUi);
window.petAPI.onPosition(({ x, y }) => {
  eventLine.textContent = `悬浮窗位置：x ${x}，y ${y}`;
});
window.petAPI.getState().then(syncUi);
updateFrameReadout();
