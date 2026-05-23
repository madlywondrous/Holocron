'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'
import { Input } from './input'

interface RenameDialogProps {
  title: string
  initialValue: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (newValue: string) => void
  onCancel: () => void
}

export function RenameDialog({
  title,
  initialValue,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: RenameDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  useEffect(() => {
    if (mounted && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div 
        className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-dialog-title"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border bg-primary/10 text-primary border-primary/20">
              <span className="material-symbols-outlined text-xl">edit</span>
            </div>
            <h3 id="rename-dialog-title" className="text-lg font-semibold text-foreground">
              {title}
            </h3>
          </div>
          
          <div className="mt-1 mb-3">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onConfirm(value)
                }
              }}
              className="w-full text-base font-medium bg-background"
              placeholder="Enter new tab name"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={() => onConfirm(value)}
              disabled={!value.trim()}
              className="w-full sm:w-auto"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
