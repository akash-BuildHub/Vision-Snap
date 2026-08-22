import { useEffect, useRef } from "react";

/**
 * Space is a text character and a button activator before it is ever a
 * shortcut, so bail out whenever the user is plainly doing one of those.
 * Range inputs are deliberately allowed: the video scrubber takes focus on
 * click, and Space should keep working afterwards.
 */
const isTypingTarget = (target) => Boolean(target) && (
  target.isContentEditable ||
  target.tagName === "TEXTAREA" ||
  (target.tagName === "INPUT" && target.type !== "range")
);

/** Fire `onTrigger` when Space is pressed, while `enabled`. */
export function useSpaceShortcut({ enabled, onTrigger }) {
  const triggerRef = useRef(onTrigger);

  useEffect(() => {
    triggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (event) => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      // Suppresses both page scroll and re-activation of a focused button.
      event.preventDefault();
      if (triggerRef.current) triggerRef.current();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
