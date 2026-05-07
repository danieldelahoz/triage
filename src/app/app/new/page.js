import { createTicket } from './actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function NewTicketPage() {
  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">New ticket</h1>
        <p className="text-sm text-muted-foreground">
          Paste in a support ticket. Triage will analyze it and suggest root causes.
        </p>
      </header>

      <form action={createTicket} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Brief one-line summary of the issue"
            required
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Paste the full ticket text here. Include error messages, steps to reproduce, customer context — everything you have."
            required
            rows={12}
            maxLength={50000}
            className="resize-y font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Markdown is supported. Up to 50,000 characters.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer (optional)</Label>
            <Input
              id="customerName"
              name="customerName"
              placeholder="Acme Inc."
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productArea">Product area (optional)</Label>
            <Input
              id="productArea"
              name="productArea"
              placeholder="Auth, Billing, etc."
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority (optional)</Label>
            <Select name="priority" defaultValue="none">
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not set</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button type="submit">Create ticket</Button>
        </div>
      </form>
    </div>
  )
}