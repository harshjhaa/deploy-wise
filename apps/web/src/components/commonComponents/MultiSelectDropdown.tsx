import { useState } from "react";
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
  const normalizedSearch = search.toLowerCase();
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(normalizedSearch),
  );

  function toggleOption(optionId: string) {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
      return;
    }
    if (selectedIds.length < maxSelections)
      onChange([...selectedIds, optionId]);
  }

  return (
    <fieldset className="multi-select-dropdown">
      <legend>{label}</legend>
      <button
        className="multi-select-trigger"
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {selectedIds.length ? `${selectedIds.length} selected` : placeholder}
        <span aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
      </button>
      {isOpen && (
        <div className="multi-select-menu">
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
        </div>
      )}
    </fieldset>
  );
}
