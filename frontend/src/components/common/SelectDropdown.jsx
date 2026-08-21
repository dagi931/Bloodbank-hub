import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import './SelectDropdown.css';

export default function SelectDropdown({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  placeholder = 'Select an option'
}) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setHighlighted(-1);
  }, []);

  const selectedIndex = options.findIndex(o => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const listHeight = Math.min(listRef.current ? listRef.current.scrollHeight : 0, 240);
    setDropUp(spaceBelow < listHeight + 12 && rect.top > spaceBelow);
  }, [open]);

  useEffect(() => {
    if (open && highlighted >= 0 && listRef.current) {
      const node = listRef.current.children[highlighted];
      if (node) node.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  const openList = () => {
    setOpen(true);
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const selectOption = (opt) => {
    onChange(opt.value);
    close();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (open) {
          if (highlighted >= 0 && options[highlighted]) selectOption(options[highlighted]);
        } else {
          openList();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList();
        else setHighlighted(h => Math.min(h + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList();
        else setHighlighted(h => Math.max(h - 1, 0));
        break;
      case 'Tab':
        close();
        break;
      default:
        break;
    }
  };

  return (
    <div className={`select-dd${open ? ' select-dd-open' : ''}${disabled ? ' select-dd-disabled' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="select-dd-control"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleKeyDown}
      >
        <span className="select-dd-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`select-dd-chevron${open ? ' open' : ''}`} />
      </button>

      {open && options.length > 0 && (
        <ul
          className={`select-dd-list${dropUp ? ' drop-up' : ''}`}
          role="listbox"
          ref={listRef}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`select-dd-option${opt.value === value ? ' selected' : ''}${i === highlighted ? ' highlighted' : ''}`}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => selectOption(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
