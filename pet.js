const petElement = document.querySelector("#floatingPet");
const hitbox = document.querySelector("#petHitbox");
const player = new window.PetSprite.SpritePlayer(petElement);

let drag = null;
let lastInteractive = null;

function publishInteractive(value) {
  if (lastInteractive === value) return;
  lastInteractive = value;
  window.petAPI.setPointerInteractive(value);
}

function pointInsideHitbox(clientX, clientY) {
  const rect = hitbox.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

window.addEventListener("mousemove", (event) => {
  if (!drag) publishInteractive(pointInsideHitbox(event.clientX, event.clientY));
});

window.addEventListener("mouseleave", () => {
  if (!drag) publishInteractive(false);
});

hitbox.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  hitbox.setPointerCapture(event.pointerId);
  drag = {
    pointerId: event.pointerId,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    moved: false,
  };
  hitbox.classList.add("dragging");
  window.petAPI.dragStart({
    pointerId: event.pointerId,
    pointerScreenX: event.screenX,
    pointerScreenY: event.screenY,
    pointerWindowX: event.clientX,
    pointerWindowY: event.clientY,
  });
});

hitbox.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (
    Math.abs(event.screenX - drag.startScreenX) >= 4 ||
    Math.abs(event.screenY - drag.startScreenY) >= 4
  ) {
    drag.moved = true;
  }
  if (!drag.moved) return;
  window.petAPI.dragMove({
    pointerId: event.pointerId,
    pointerScreenX: event.screenX,
    pointerScreenY: event.screenY,
  });
});

function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const wasMoved = drag.moved;
  window.petAPI.dragEnd({ pointerId: event.pointerId });
  if (hitbox.hasPointerCapture(event.pointerId)) {
    hitbox.releasePointerCapture(event.pointerId);
  }
  drag = null;
  hitbox.classList.remove("dragging");
  publishInteractive(pointInsideHitbox(event.clientX, event.clientY));
  if (!wasMoved) window.petAPI.togglePaused();
}

hitbox.addEventListener("pointerup", finishDrag);
hitbox.addEventListener("pointercancel", finishDrag);
hitbox.addEventListener("lostpointercapture", () => {
  drag = null;
  hitbox.classList.remove("dragging");
});

window.petAPI.onState((state) => {
  player.setState(state.state);
  player.setPaused(state.paused);
});
window.petAPI.getState().then((state) => {
  player.setState(state.state);
  player.setPaused(state.paused);
});

window.setTimeout(() => publishInteractive(false), 120);
