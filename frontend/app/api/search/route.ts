import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/search — optional web search for agent WEB_SEARCH tool
 * Supports Serper (SERPER_API_KEY) or Brave (BRAVE_SEARCH_API_KEY)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = String(body.query || '').trim();
    const context = String(body.context || '').trim();

    if (!query) {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    const serperKey = process.env.SERPER_API_KEY;
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;

    if (serperKey) {
      const resp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': serperKey,
        },
        body: JSON.stringify({ q: context ? `${query} ${context}` : query, num: 5 }),
      });
      if (!resp.ok) {
        return NextResponse.json(
          { message: `Serper search failed: ${resp.status}` },
          { status: 502 }
        );
      }
      const data = await resp.json() as {
        organic?: Array<{ title?: string; link?: string; snippet?: string }>;
      };
      const results = data.organic || [];
      const summary = results
        .slice(0, 3)
        .map(r => `${r.title}: ${r.snippet || ''}`)
        .join('\n');
      return NextResponse.json({
        summary: summary || 'No results found.',
        sources: results.slice(0, 5).map(r => ({
          title: r.title || 'Result',
          url: r.link || '',
        })),
      });
    }

    if (braveKey) {
      const q = encodeURIComponent(context ? `${query} ${context}` : query);
      const resp = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${q}&count=5`,
        {
          headers: {
            Accept: 'application/json',
            'X-Subscription-Token': braveKey,
          },
        }
      );
      if (!resp.ok) {
        return NextResponse.json(
          { message: `Brave search failed: ${resp.status}` },
          { status: 502 }
        );
      }
      const data = await resp.json() as {
        web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
      };
      const results = data.web?.results || [];
      const summary = results
        .slice(0, 3)
        .map(r => `${r.title}: ${r.description || ''}`)
        .join('\n');
      return NextResponse.json({
        summary: summary || 'No results found.',
        sources: results.map(r => ({
          title: r.title || 'Result',
          url: r.url || '',
        })),
      });
    }

    return NextResponse.json({
      summary:
        'Web search is not configured. Add SERPER_API_KEY or BRAVE_SEARCH_API_KEY to .env.local.',
      sources: [],
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
