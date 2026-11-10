import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/lib/config'

export function SuggestProjectForm() {
  return <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
    <h3 className="text-2xl font-bold">Suggest a hardware project</h3>
    <p className="my-4 text-muted-foreground">Describe the board, components and what you want to learn. Suggestions are tracked publicly on GitHub.</p>
    <Button asChild><a href={`${APP_CONFIG.githubUrl}/issues/new?template=feature_request.md`} target="_blank" rel="noopener noreferrer">Open a GitHub suggestion</a></Button>
  </div>
}
