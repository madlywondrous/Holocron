'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onCancel])

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
        aria-labelledby="dialog-title"
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border",
            variant === 'danger'
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-primary/10 text-primary border-primary/20"
          )}>
            <span className="material-symbols-outlined text-2xl">
              {variant === 'danger' ? 'warning' : 'info'}
            </span>
          </div>

          <div className="flex-1 min-w-0 mt-3 sm:mt-0">
            <h3 id="dialog-title" className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {message}
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'destructive' : 'default'}
                onClick={onConfirm}
                className="w-full sm:w-auto"
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
