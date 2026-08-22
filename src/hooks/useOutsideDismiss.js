import { useEffect } from "react";

/** Call `onDismiss` when a click lands outside `ref` while `isOpen`. */
export function useOutsideDismiss(ref, isOpen, onDismiss) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onDismiss();
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [ref, isOpen, onDismiss]);
}
