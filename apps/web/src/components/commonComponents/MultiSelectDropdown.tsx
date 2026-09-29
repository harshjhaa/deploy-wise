import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./MultiSelectDropdown.scss";

export type MultiSelectOption = {
  id: string;
  label: string;
};

type MultiSelectDropdownProps = Readonly<{
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  maxSelections: number;
  minSelections: number;
  placeholder: string;
  disabled?: boolean;
}>;

export function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
  maxSelections,
  minSelections,
  placeholder,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const normalizedSearch = search.toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedSearch),
  );

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    function updateMenuPosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 4;
      const maxMenuHeight = 280;
      const spaceAbove = Math.max(0, bounds.top - viewportPadding - gap);
      const spaceBelow = Math.max(
        0,
        window.innerHeight - bounds.bottom - viewportPadding - gap,
      );
      const openAbove = spaceBelow < maxMenuHeight && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const menuHeight = Math.min(maxMenuHeight, Math.max(80, availableSpace));
      const width = Math.min(bounds.width, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, bounds.left),
        window.innerWidth - viewportPadding - width,
      );

      setMenuPosition({
        top: openAbove
          ? Math.max(viewportPadding, bounds.top - menuHeight - gap)
          : bounds.bottom + gap,
        left,
        width,
        maxHeight: menuHeight,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  function toggleOption(optionId: string) {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
      return;
    }
    if (selectedIds.length < maxSelections)
      onChange([...selectedIds, optionId]);
  }

  return (
    <>
      <fieldset className="multi-select-dropdown">
        <legend>{label}</legend>
        <button
          ref={triggerRef}
          className="multi-select-trigger"
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          disabled={disabled}
        >
          {selectedIds.length ? `${selectedIds.length} selected` : placeholder}
          <span aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
        </button>
      </fieldset>
      {isOpen && menuPosition && createPortal(
        <div
          className="multi-select-menu"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
        >
          <input
            className="multi-select-search"
            type="search"
            placeholder="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={`Search ${label}`}
          />
          <div className="multi-select-options">
            {filteredOptions.map((option) => (
              <label key={option.id} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
            {!filteredOptions.length && (
              <span className="multi-select-empty">No users found</span>
            )}
          </div>
          <span className="multi-select-count">
            {selectedIds.length}/{maxSelections} selected
          </span>{" "}
          {selectedIds.length < minSelections && (
            <span className="multi-select-hint">
              Select at least {minSelections}
            </span>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
