import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  useMemo,
} from 'react';
import styles from './Select.module.css';

/* ================================================================
   Types
   ================================================================ */

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Selection change handler */
  onChange: (value: string) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Visible label */
  label?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/* ================================================================
   Component
   ================================================================ */

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  label,
  disabled = false,
  className,
}) => {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  // ---- Close on outside click ----
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ---- Focus search when opened ----
  useEffect(() => {
    if (open) {
      setSearch('');
      setHighlightedIndex(-1);
      // Small delay for the dropdown to render
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // ---- Keyboard navigation ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
            onChange(filtered[highlightedIndex].value);
            setOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setHighlightedIndex(filtered.length - 1);
          break;
      }
    },
    [open, filtered, highlightedIndex, onChange],
  );

  // ---- Scroll highlighted into view ----
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

  const triggerClasses = [styles.trigger, open && styles.triggerOpen]
    .filter(Boolean)
    .join(' ');

  const chevronClasses = [styles.chevron, open && styles.chevronOpen]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={wrapperRef}
      className={wrapperClasses}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label id={`${uid}-label`} className={styles.label}>
          {label}
        </label>
      )}

      <button
        type="button"
        className={triggerClasses}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${uid}-label` : undefined}
      >
        {selectedOption ? (
          <span className={styles.triggerValue}>
            {selectedOption.icon && (
              <span className={styles.optionIcon} aria-hidden="true">
                {selectedOption.icon}
              </span>
            )}
            <span>{selectedOption.label}</span>
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}

        <svg
          className={chevronClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-labelledby={label ? `${uid}-label` : undefined}>
          {options.length > 5 && (
            <div className={styles.searchContainer}>
              <input
                ref={searchRef}
                className={styles.searchInput}
                placeholder="Search…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                aria-label="Filter options"
                autoComplete="off"
              />
            </div>
          )}

          <div className={styles.optionsList} ref={listRef}>
            {filtered.length > 0 ? (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                const optClasses = [
                  styles.option,
                  isSelected && styles.optionSelected,
                  isHighlighted && styles.optionHighlighted,
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={optClasses}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {opt.icon && (
                      <span className={styles.optionIcon} aria-hidden="true">
                        {opt.icon}
                      </span>
                    )}
                    {opt.label}
                  </button>
                );
              })
            ) : (
              <div className={styles.noResults}>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Select.displayName = 'Select';
