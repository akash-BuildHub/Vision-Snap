import React, { useCallback, useState } from "react";
import AppHeader from "./components/AppHeader/AppHeader";
import ClassBox from "./components/ClassBox/ClassBox";
import ImageModal from "./components/ImageModal/ImageModal";

/**
 * Root composition. Holds only the state that has to be shared between class
 * boxes: which menu is open, which box owns the Space shortcut, and the
 * full-screen preview.
 */
export default function App() {
  const [classes, setClasses] = useState([{ id: 1, name: "Class 1" }]);
  const [nextId, setNextId] = useState(2);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [shortcutOwnerId, setShortcutOwnerId] = useState(null);

  const [preview, setPreview] = useState({ open: false, images: [], index: 0 });

  const dismissMenus = useCallback(() => setActiveMenuId(null), []);

  const claimShortcut = useCallback((id) => setShortcutOwnerId(id), []);

  const releaseShortcut = useCallback((id) => {
    setShortcutOwnerId((prev) => (prev === id ? null : prev));
  }, []);

  const addClass = () => {
    // Deleting every class restarts the numbering rather than counting on.
    if (classes.length === 0) {
      setClasses([{ id: 1, name: "Class 1" }]);
      setNextId(2);
      return;
    }

    setClasses((prev) => [...prev, { id: nextId, name: `Class ${nextId}` }]);
    setNextId((prev) => prev + 1);
  };

  const deleteClass = useCallback((id) => {
    setClasses((prev) => prev.filter((item) => item.id !== id));
    setShortcutOwnerId((prev) => (prev === id ? null : prev));
    setActiveMenuId(null);
  }, []);

  const openPreview = useCallback((images, index) => {
    setPreview({ open: true, images, index });
  }, []);

  const closePreview = useCallback(() => {
    setPreview((prev) => ({ ...prev, open: false }));
  }, []);

  const stepPreview = useCallback((delta) => {
    setPreview((prev) => {
      if (prev.images.length === 0) return prev;
      const total = prev.images.length;
      return { ...prev, index: (prev.index + delta + total) % total };
    });
  }, []);

  const showPrev = useCallback(() => stepPreview(-1), [stepPreview]);
  const showNext = useCallback(() => stepPreview(1), [stepPreview]);

  return (
    <>
      <AppHeader />

      <div className="class-container">
        {classes.map((classItem) => (
          <ClassBox
            key={classItem.id}
            id={classItem.id}
            initialName={classItem.name}
            isMenuOpen={activeMenuId === classItem.id}
            ownsShortcut={shortcutOwnerId === classItem.id}
            shortcutsPaused={preview.open}
            onDeleteClass={deleteClass}
            onMenuToggle={() => setActiveMenuId(activeMenuId === classItem.id ? null : classItem.id)}
            onMenuDismiss={dismissMenus}
            onOpenPreview={openPreview}
            onClaimShortcut={claimShortcut}
            onReleaseShortcut={releaseShortcut}
          />
        ))}

        <div className="add-class" onClick={addClass}>
          + Add a class
        </div>
      </div>

      <ImageModal
        isOpen={preview.open}
        images={preview.images}
        index={preview.index}
        onClose={closePreview}
        onPrev={showPrev}
        onNext={showNext}
      />
    </>
  );
}
