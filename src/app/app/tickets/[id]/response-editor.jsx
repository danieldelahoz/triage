'use client'

import { useState, useTransition } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { saveResponse, generateResponse } from './actions'

export function ResponseEditor({ ticketId, initialResponse, hasSelectedRootCause }) {
  const [response, setResponse] = useState(initialResponse || '')
  const [savedResponse, setSavedResponse] = useState(initialResponse || '')
  const [isSaving, startSaving] = useTransition()
  const [isGenerating, startGenerating] = useTransition()
  const [copied, setCopied] = useState(false)

  const isDirty = response !== savedResponse
  const hasResponse = response.trim().length > 0

  const handleChange = (e) => {
    setResponse(e.target.value)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const valueAtSubmit = response
    const formData = new FormData()
    formData.set('response', response)
    startSaving(async () => {
      await saveResponse(ticketId, formData)
      setSavedResponse(valueAtSubmit)
    })
  }

  const handleGenerate = () => {
    startGenerating(async () => {
      const newDraft = await generateResponse(ticketId)
      if (newDraft) {
        setResponse(newDraft)
        setSavedResponse(newDraft)
      }
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  if (!hasResponse) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground mb-4">
          {hasSelectedRootCause
            ? 'Generate a draft response based on the ticket, your notes, and the selected root cause.'
            : 'Select a root cause first, then generate a response draft.'}
        </p>
        <Button
          onClick={handleGenerate}
          disabled={!hasSelectedRootCause || isGenerating}
        >
          {isGenerating ? 'Generating…' : 'Generate response'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Textarea
        name="response"
        value={response}
        onChange={handleChange}
        rows={14}
        maxLength={50000}
        className="resize-y text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {response.length} characters
          {isDirty && (
            <span className="ml-2 text-amber-700 dark:text-amber-400">• unsaved</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={isDirty}
            title={isDirty ? 'Save before copying' : 'Copy to clipboard'}
          >
            {copied ? (
              <>
                <Check size={14} className="mr-1.5" /> Copied
              </>
            ) : (
              <>
                <Copy size={14} className="mr-1.5" /> Copy
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating || !hasSelectedRootCause}
          >
            {isGenerating ? 'Regenerating…' : 'Regenerate'}
          </Button>
          <Button type="submit" disabled={!isDirty || isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}