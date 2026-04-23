import React, { useMemo, useState, useCallback } from 'react'
import ReactMarkdown, { type Components, type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css' // Import KaTeX styles for math rendering

interface MarkdownRendererProps {
  content: string
  className?: string
}

function CodeBlockCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for insecure context
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md border border-border/50 bg-card/90 px-2 py-1 text-xs text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-muted/50 hover:text-foreground"
      title="Copy code"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  )
}

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(extractTextContent).join('')
  if (typeof node === 'object' && 'props' in node) {
    return extractTextContent((node as React.ReactElement).props.children)
  }
  return ''
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="first:mt-0 mb-3 mt-4 text-2xl font-bold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="first:mt-0 mb-2 mt-3 text-xl font-bold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="first:mt-0 mb-2 mt-3 text-lg font-semibold text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="first:mt-0 mb-1 mt-2 text-base font-semibold text-foreground">{children}</h4>,
  h5: ({ children }) => <h5 className="first:mt-0 mb-1 mt-2 text-sm font-semibold text-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="first:mt-0 mb-1 mt-2 text-sm font-medium text-foreground">{children}</h6>,
  p: ({ children }) => <p className="last:mb-0 mb-4 leading-relaxed text-foreground/90">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  del: ({ children }) => <del className="line-through text-foreground/70">{children}</del>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mb-4 ml-4 list-disc space-y-1 text-foreground/90">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 ml-4 list-decimal space-y-1 text-foreground/90">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
  input: ({ type, checked, disabled }) => {
    if (type === 'checkbox') {
      return <input type="checkbox" checked={checked} disabled={disabled} className="mr-2 scale-90 accent-primary" readOnly />
    }

    return <input type={type} checked={checked} disabled={disabled} readOnly />
  },
  pre: ({ children }) => {
    const codeText = extractTextContent(children)
    return (
      <div className="group relative my-4">
        <pre className="overflow-x-auto rounded-lg border border-border/60 bg-card/50 p-4 font-mono text-sm leading-relaxed">
          {children}
        </pre>
        <CodeBlockCopyButton code={codeText} />
      </div>
    )
  },
  code: ({ className, children }) => {
    if (!className) {
      return (
        <code className="mx-0.5 rounded-md border bg-muted/80 px-1.5 py-0.5 font-mono text-sm text-foreground">
          {children}
        </code>
      )
    }

    return (
      <code className={cn('block p-0 font-mono text-sm leading-relaxed', className)}>
        {children}
      </code>
    )
  },
  hr: () => <hr className="my-6 border-border/40" />,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-r-md border-l-4 border-primary/30 bg-muted/10 py-2 pl-4 italic text-foreground/80">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border/40 bg-muted/50">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/20">{children}</tbody>,
  th: ({ children }) => (
    <th className="border-r border-border/20 px-4 py-3 text-left font-semibold text-foreground last:border-r-0">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-r border-border/20 px-4 py-3 align-top text-foreground/90 last:border-r-0">{children}</td>
  ),
}

const rehypePlugins = [
  [rehypeHighlight, { ignoreMissing: true }],
  rehypeKatex
] as unknown as NonNullable<ReactMarkdownOptions['rehypePlugins']>
const remarkPlugins = [remarkGfm, remarkMath] as unknown as NonNullable<ReactMarkdownOptions['remarkPlugins']>

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const processedContent = useMemo(() => {
    if (!content) {
      return ''
    }

    return content.trim().replace(/\n{3,}/g, '\n\n')
  }, [content])

  if (!processedContent) {
    return null
  }

  return (
    <div className={cn('markdown-body text-base leading-relaxed', className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={markdownComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
