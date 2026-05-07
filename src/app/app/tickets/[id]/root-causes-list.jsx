'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { selectRootCause } from './actions'

export function RootCausesList({ ticketId, rootCauses, selectedRootCauseId }) {
  const [isPending, startTransition] = useTransition()

  const handleSelect = (rootCauseId) => {
    const newSelection = selectedRootCauseId === rootCauseId ? null : rootCauseId
    startTransition(async () => {
      await selectRootCause(ticketId, newSelection)
    })
  }

  return (
    <div className="space-y-3">
      {rootCauses
        .sort((a, b) => b.confidence - a.confidence)
        .map((rc) => {
          const isSelected = rc.id === selectedRootCauseId
          return (
            <button
              key={rc.id}
              onClick={() => handleSelect(rc.id)}
              disabled={isPending}
              className={`w-full text-left border rounded-lg p-4 transition-colors ${
                isSelected
                  ? 'border-foreground bg-muted/50'
                  : 'hover:bg-muted'
              } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2 flex-1">
                  {isSelected && (
                    <Check size={14} className="mt-0.5 shrink-0" />
                  )}
                  <p className="font-medium text-sm">{rc.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {rc.confidence}%
                </span>
              </div>
              {rc.reasoning && (
                <p className="text-xs text-muted-foreground leading-relaxed pl-0">
                  {rc.reasoning}
                </p>
              )}
            </button>
          )
        })}
      {selectedRootCauseId && (
        <p className="text-xs text-muted-foreground italic pt-1">
          Click the selected card again to deselect.
        </p>
      )}
    </div>
  )
}