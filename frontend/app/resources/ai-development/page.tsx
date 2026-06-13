import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bot, Zap, Code2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import aiResources from '@/data/resources/ai-development-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'AI-Powered Development Tools & Resources',
  description: 'Master AI coding assistants like GitHub Copilot, ChatGPT, Claude, and Cursor. Learn prompt engineering, and build software 10x faster with AI.',
  path: '/resources/ai-development',
  keywords: ['AI coding tools', 'GitHub Copilot', 'ChatGPT API', 'Claude AI', 'Cursor IDE', 'prompt engineering'],
});

export default function AIDevelopmentResourcesPage() {
  const { resources, overview } = aiResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));
  const breadcrumbs = generateBreadcrumbs('/resources/ai-development');

  // Categorize resources
  const aiAssistants = resources.filter(r => r.category === 'AI Coding Assistants');
  const freeOptions = resources.filter(r =>
    r.slug === 'codeium' || r.pricing?.includes('FREE')
  );

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <main role="main" aria-label="AI Development Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-20">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <Link
              href="/resources"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors touch-action-manipulation active:scale-[0.98]"
              aria-label="Go back to all resources page"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <Sparkles className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">AI Tools</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{freeOptions.length}</div>
                  <p className="text-sm text-muted-foreground">Free Options</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">10x</div>
                  <p className="text-sm text-muted-foreground">Faster Coding</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">2026</div>
                  <p className="text-sm text-muted-foreground">Latest Tools</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Use AI for Coding */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <Code2 className="h-7 w-7 text-primary" />
                Why AI-Powered Development?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚡ Build Faster</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Generate boilerplate code, write tests, and create functions in seconds. AI assistants understand context and suggest complete implementations.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🐛 Debug Smarter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Paste error messages and get detailed explanations with fixes. AI can analyze stack traces and suggest solutions instantly.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Learn Continuously</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ask questions about unfamiliar code, frameworks, or patterns. AI explains concepts and provides examples in real-time.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🎯 Focus on Logic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Let AI handle repetitive tasks while you focus on architecture and business logic. More time for creative problem-solving.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* AI Coding Assistants */}
        <section className="py-12">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-2">AI Coding Assistants</h2>
            <p className="text-muted-foreground mb-8">
              Compare features, pricing, and capabilities of leading AI code completion tools
            </p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {aiAssistants.map((tool) => (
                <Card key={tool.slug} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-2 break-words">{tool.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{tool.shortDesc}</CardDescription>
                      </div>
                      {tool.pricing?.includes('FREE') && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 shrink-0">
                          FREE
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {/* Key Features */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {Object.entries(tool.features).slice(0, 3).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                            <span className="mr-2 shrink-0">•</span>
                            <span className="break-words">{value as string}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pricing */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold">Pricing:</span>
                        <span className="text-sm font-bold text-primary break-words text-right">{tool.pricing}</span>
                      </div>
                    </div>

                    {/* Best For */}
                    {tool.useCases && (
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                        <div className="flex flex-wrap gap-2">
                          {tool.useCases.slice(0, 3).map((useCase, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={useCase}>
                              {useCase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href={`/resources/ai-development/${tool.slug}`}
                      className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98] mt-auto"
                    >
                      View Details & Setup
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Free vs Paid Comparison */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Free vs Paid AI Tools</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-green-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className="bg-green-500">FREE</Badge>
                      Best Free Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Codeium</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Unlimited usage, all features, supports 70+ languages
                      </p>
                      <Badge variant="outline">No limits</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">ChatGPT (GPT-3.5)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Limited availability, good for learning and simple tasks
                      </p>
                      <Badge variant="outline">Message caps</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">GitHub Copilot</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Free for students and open-source maintainers
                      </p>
                      <Badge variant="outline">Verified only</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge>PAID</Badge>
                      Worth Paying For
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Cursor IDE ($20/mo)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        AI-native editor with codebase chat and multi-file edits
                      </p>
                      <Badge variant="outline">Best DX</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Claude Pro ($20/mo)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        200K context window, analyze entire codebases
                      </p>
                      <Badge variant="outline">Large projects</Badge>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">GitHub Copilot ($10/mo)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Best in-IDE assistant, instant suggestions
                      </p>
                      <Badge variant="outline">Most popular</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 p-6 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">💡 Pro Tip</h3>
                <p className="text-sm text-muted-foreground">
                  Start with <strong>Codeium (free)</strong> for in-IDE completions + <strong>ChatGPT</strong> for complex questions.
                  Once you see the value, upgrade to <strong>Cursor IDE</strong> for the best overall experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Code with AI?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Test AI-generated code in our virtual Studio before deploying to hardware
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/studio"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98] inline-flex items-center gap-2"
              >
                <Zap className="h-5 w-5" />
                Try AI Studio
              </Link>
              <Link
                href="/build"
                className="px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors touch-action-manipulation active:scale-[0.98] inline-flex items-center gap-2"
              >
                <Code2 className="h-5 w-5" />
                Launch Web IDE
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNavigation />
    </>
  );
}
