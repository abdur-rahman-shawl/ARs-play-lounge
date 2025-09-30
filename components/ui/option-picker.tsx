"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export type OptionItem = {
  value: string;
  label: string;
  description?: string;
};

type OptionPickerProps = {
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  buttonLabel?: string;
};

export function OptionPicker({
  label,
  value,
  options,
  onChange,
  disabled = false,
  buttonLabel,
}: OptionPickerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const content = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setOpen(true);
      }}
      className={clsx(
        "flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-left text-sm text-white",
        "transition hover:border-accent-neon/70 hover:bg-accent-neon/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-neon",
        disabled && "opacity-60",
      )}
    >
      <span className="truncate">
        {buttonLabel ? `${buttonLabel}: ${selected?.label ?? "Select"}` : selected?.label ?? "Select"}
      </span>
      <svg className="h-3 w-3 text-slate-300" viewBox="0 0 10 6" aria-hidden="true">
        <path d="M0 0 L5 6 L10 0 Z" fill="currentColor" />
      </svg>
    </button>
  );

  const modal =
    mounted && open
      ? createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setOpen(false);
              }
            }}
          >
            <div className="glass-panel relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glow">
              <header className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Adjust</p>
                  <h3 className="text-xl font-semibold text-white">{label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                >
                  Close
                </button>
              </header>

              <div className="flex flex-col gap-2">
                {options.map((option) => {
                  const selectedOption = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={clsx(
                        "flex flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition",
                        selectedOption && "border-accent-neon bg-accent-neon/15 text-white",
                        "hover:border-accent-neon/80 hover:bg-accent-neon/20",
                      )}
                    >
                      <span className="font-semibold">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-slate-300">{option.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {content}
      {modal}
    </>
  );
}
