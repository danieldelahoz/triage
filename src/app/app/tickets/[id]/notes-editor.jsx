'use client'

import { useState, useTransition } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { saveNotes } from './actions'

export function NotesEditor({ ticketId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [savedNotes, setSavedNotes] = useState(initialNotes || '')
  const [isPending, startTransition] = useTransition()

  const isDirty = notes !== savedNotes

  const handleChange = (e) => {
    setNotes(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.set('notes', notes)
    const valueAtSubmit = notes
    startTransition(async () => {
      await saveNotes(ticketId, formData)
      setSavedNotes(valueAtSubmit)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        name="notes"
        value={notes}
        onChange={handleChange}
        placeholder="What have you investigated? What did you find? What's still unclear?"
        rows={10}
        maxLength={50000}
        className="resize-y font-mono text-sm"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {notes.length} {notes.length === 1 ? 'character' : 'characters'}
          {isDirty && (
            <span className="ml-2 text-amber-700 dark:text-amber-400">• unsaved</span>
          )}
        </span>
        <Button type="submit" disabled={!isDirty || isPending}>
          {isPending ? 'Saving…' : 'Save notes'}
        </Button>
      </div>
    </form>
  )
}