// src/components/ui/DropdownMenu.jsx
import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const DropdownContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }) {
  const { setOpen, triggerRef } = useContext(DropdownContext);

  const handleClick = (e) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e);
        handleClick(e);
      },
    });
  }

  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-border-default bg-transparent hover:bg-bg-muted h-9 px-4 py-2"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = "start", className = "" }) {
  const { open, setOpen, triggerRef } = useContext(DropdownContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, triggerRef]);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, placement: 'bottom' });

  useEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const contentHeight = contentRef.current.offsetHeight || 300;
      const contentWidth = contentRef.current.offsetWidth || 200;
      
      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;
      let placement = 'bottom';

      // Check for bottom overflow
      if (rect.bottom + contentHeight > window.innerHeight) {
        top = rect.top + window.scrollY - contentHeight - 8;
        placement = 'top';
      }

      // Check for right overflow
      if (left + contentWidth > window.innerWidth) {
        left = rect.right + window.scrollX - contentWidth;
      }

      // Check for left overflow
      if (left < 0) left = 4;

      setCoords({ top, left, width: rect.width, placement });
    }
  }, [open, triggerRef, align, children]); // children added to trigger re-calc if content changes

  if (!open) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={`fixed z-[9999] mt-2 min-w-[12rem] max-h-[380px] overflow-y-auto custom-scrollbar-mini rounded-xl border border-border-default bg-bg-raised/95 p-1 text-text-primary shadow-2xl animate-in fade-in ${coords.placement === 'top' ? 'slide-in-from-bottom-2' : 'zoom-in-95'} duration-150 ${className}`}
      style={{
        top: coords.top,
        left: coords.left,
        boxShadow: "0 20px 40px -15px rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export function DropdownMenuGroup({ children }) {
  return <div className="p-1">{children}</div>;
}

export function DropdownMenuItem({ children, onClick, disabled, className = "" }) {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    setOpen(false);
  };

  return (
    <div
      role="menuitem"
      onClick={handleClick}
      className={`relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-[13px] font-semibold outline-none transition-all duration-75 
        ${disabled ? "pointer-events-none opacity-50" : "hover:bg-accent hover:text-white cursor-pointer group"} 
        ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className = "" }) {
  return (
    <div className={`px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-text-quaternary ${className}`}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border-muted my-1 mx-1" />;
}

export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange, disabled }) {
  return (
    <DropdownMenuItem
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange?.(!checked);
      }}
      className="pl-8"
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </DropdownMenuItem>
  );
}

// Export as default object for easy importing if needed
const DropdownComponent = {
  Menu: DropdownMenu,
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Group: DropdownMenuGroup,
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
  CheckboxItem: DropdownMenuCheckboxItem,
};

export default DropdownComponent;
