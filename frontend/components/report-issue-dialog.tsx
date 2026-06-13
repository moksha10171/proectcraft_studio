"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle2, Loader2, AlertTriangle, Flag } from "lucide-react"

interface ReportIssueDialogProps {
  projectTitle?: string
  projectId?: string
  trigger?: React.ReactNode
}

export function ReportIssueDialog({ projectTitle, projectId, trigger }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [issueType, setIssueType] = useState("bug")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setTimeout(() => {
        setIsSubmitted(false)
        setIssueType("bug")
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl bg-transparent">
            <Flag className="h-4 w-4" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Report Submitted</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for helping us improve. We'll review your report shortly.
            </p>
            <Button onClick={() => setOpen(false)} className="rounded-xl">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Report an Issue
              </DialogTitle>
              <DialogDescription>
                {projectTitle
                  ? `Report a problem with "${projectTitle}"`
                  : "Help us improve by reporting bugs or issues"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              {/* Issue Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Issue Type</Label>
                <RadioGroup value={issueType} onValueChange={setIssueType} className="grid grid-cols-2 gap-2">
                  <div>
                    <RadioGroupItem value="bug" id="bug" className="peer sr-only" />
                    <Label
                      htmlFor="bug"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-transparent p-3 transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-sm font-medium">Bug</span>
                      <span className="text-xs text-muted-foreground">Something broken</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="content" id="content" className="peer sr-only" />
                    <Label
                      htmlFor="content"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-transparent p-3 transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-sm font-medium">Content</span>
                      <span className="text-xs text-muted-foreground">Incorrect info</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="download" id="download" className="peer sr-only" />
                    <Label
                      htmlFor="download"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-transparent p-3 transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-sm font-medium">Download</span>
                      <span className="text-xs text-muted-foreground">File issues</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="other" id="other" className="peer sr-only" />
                    <Label
                      htmlFor="other"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-border bg-transparent p-3 transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="text-sm font-medium">Other</span>
                      <span className="text-xs text-muted-foreground">Something else</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="report-email" className="text-sm font-medium">
                  Email (optional)
                </Label>
                <Input id="report-email" type="email" placeholder="you@example.com" className="h-11 rounded-xl" />
                <p className="text-xs text-muted-foreground">For follow-up questions about your report</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="report-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="report-description"
                  placeholder="Please describe the issue in detail..."
                  required
                  className="min-h-[120px] resize-none rounded-xl"
                />
              </div>

              {/* Hidden project info */}
              {projectId && <input type="hidden" name="projectId" value={projectId} />}

              <Button type="submit" className="w-full h-11 rounded-xl" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
