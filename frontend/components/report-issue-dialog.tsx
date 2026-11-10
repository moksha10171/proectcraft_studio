"use client"
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { APP_CONFIG } from '@/lib/config'

export function ReportIssueDialog({ trigger, projectId, projectTitle }: { trigger?: ReactNode; projectId?: number | string; projectTitle?: string }) {
  const [open, setOpen] = useState(false)
  const params = new URLSearchParams({ template: 'bug_report.md', title: projectTitle ? `Issue: ${projectTitle}` : '' })
  if (projectId) params.set('body', `Project: ${projectTitle || projectId}\n\nSteps to reproduce:\n\nExpected result:\n\nActual result:\n\nOS and browser:\n`)
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{trigger || <Button variant="outline">Report issue</Button>}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Report an issue</DialogTitle>
        <DialogDescription>Reports are tracked on GitHub. Include steps to reproduce and sanitized errors. Keep API keys and private code out of public reports.</DialogDescription>
      </DialogHeader>
      <Button asChild><a href={`${APP_CONFIG.githubUrl}/issues/new?${params}`} target="_blank" rel="noopener noreferrer">Continue to GitHub</a></Button>
    </DialogContent>
  </Dialog>
}
