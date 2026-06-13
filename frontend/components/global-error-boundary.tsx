"use client"

import React from 'react'
import ErrorBoundary from './arduino-studio/error-boundary'

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallbackTitle="Something Went Wrong"
      fallbackMessage="An unexpected error occurred. Please try refreshing the page or contact support if the problem persists."
    >
      {children}
    </ErrorBoundary>
  )
}
