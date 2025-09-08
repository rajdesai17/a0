"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface SandboxedPreviewProps {
  code: string
}

export function SandboxedPreview({ code }: SandboxedPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('SandboxedPreview: Code updated:', code) // Debug log
    if (!iframeRef.current) return

    const iframe = iframeRef.current

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
  <title>Component Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: "var(--border)",
            input: "var(--input)",
            ring: "var(--ring)",
            background: "var(--background)",
            foreground: "var(--foreground)",
            primary: {
              DEFAULT: "var(--primary)",
              foreground: "var(--primary-foreground)",
            },
            secondary: {
              DEFAULT: "var(--secondary)",
              foreground: "var(--secondary-foreground)",
            },
            destructive: {
              DEFAULT: "var(--destructive)",
              foreground: "var(--destructive-foreground)",
            },
            muted: {
              DEFAULT: "var(--muted)",
              foreground: "var(--muted-foreground)",
            },
            accent: {
              DEFAULT: "var(--accent)",
              foreground: "var(--accent-foreground)",
            },
            popover: {
              DEFAULT: "var(--popover)",
              foreground: "var(--popover-foreground)",
            },
            card: {
              DEFAULT: "var(--card)",
              foreground: "var(--card-foreground)",
            },
          },
          borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
          },
        },
      },
    }
  </script>
  <style>
    :root {
      --radius: 0.625rem;
      --background: oklch(1 0 0);
      --foreground: oklch(0.141 0.005 285.823);
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.141 0.005 285.823);
      --popover: oklch(1 0 0);
      --popover-foreground: oklch(0.141 0.005 285.823);
      --primary: oklch(0.21 0.006 285.885);
      --primary-foreground: oklch(0.985 0 0);
      --secondary: oklch(0.967 0.001 286.375);
      --secondary-foreground: oklch(0.21 0.006 285.885);
      --muted: oklch(0.967 0.001 286.375);
      --muted-foreground: oklch(0.552 0.016 285.938);
      --accent: oklch(0.967 0.001 286.375);
      --accent-foreground: oklch(0.21 0.006 285.885);
      --destructive: oklch(0.637 0.237 25.331);
      --destructive-foreground: oklch(0.637 0.237 25.331);
      --border: oklch(0.92 0.004 286.32);
      --input: oklch(0.871 0.006 286.286);
      --ring: oklch(0.871 0.006 286.286);
    }
    
    .dark {
      --background: oklch(0.141 0.005 285.823);
      --foreground: oklch(0.985 0 0);
      --card: oklch(0.141 0.005 285.823);
      --card-foreground: oklch(0.985 0 0);
      --popover: oklch(0.141 0.005 285.823);
      --popover-foreground: oklch(0.985 0 0);
      --primary: oklch(0.985 0 0);
      --primary-foreground: oklch(0.21 0.006 285.885);
      --secondary: oklch(0.274 0.006 286.033);
      --secondary-foreground: oklch(0.985 0 0);
      --muted: oklch(0.21 0.006 285.885);
      --muted-foreground: oklch(0.65 0.01 286);
      --accent: oklch(0.21 0.006 285.885);
      --accent-foreground: oklch(0.985 0 0);
      --destructive: oklch(0.396 0.141 25.723);
      --destructive-foreground: oklch(0.637 0.237 25.331);
      --border: oklch(0.274 0.006 286.033);
      --input: oklch(0.274 0.006 286.033);
      --ring: oklch(0.442 0.017 285.786);
    }
    
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
      box-sizing: border-box;
      overflow: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    
    body::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Webkit */
    }
    
    #root {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      box-sizing: border-box;
      min-height: calc(100vh - 32px);
      padding: 20px 0;
    }
    
    /* Ensure components scale properly and are centered */
    #root > * {
      max-width: 100%;
      width: fit-content;
    }
    
    html {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
      box-sizing: border-box;
      font-size: 16px; /* Ensure proper font scaling */
      height: 100%;
    }
    
    html::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Webkit */
    }
    
    /* Hide all scrollbars */
    * {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    
    *::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Webkit */
    }
    
    *::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Webkit */
    }
    
    .error {
      color: #ef4444;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    // Add common icons that might be used
    const Sparkles = ({ className = "w-4 h-4", ...props }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 1.5L5 6l1.5 1.5L5 9l1.5 1.5L5 12l1.5 1.5L5 15l1.5 1.5L5 18l1.5 1.5L5 21M19 3l-1.5 1.5L19 6l-1.5 1.5L19 9l-1.5 1.5L19 12l-1.5 1.5L19 15l-1.5 1.5L19 18l-1.5 1.5L19 21" />
      </svg>
    );
    
    const Heart = ({ className = "w-4 h-4", ...props }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
    
    const Star = ({ className = "w-4 h-4", ...props }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );
    
    try {
      ${code}
      
      // Try to find and render the default export
      const componentNames = Object.keys(window).filter(key => 
        typeof window[key] === 'function' && 
        key !== 'React' && 
        key !== 'ReactDOM' && 
        key[0] === key[0].toUpperCase()
      );
      
      let ComponentToRender = null;
      
      // Look for default export or the last defined component
      if (typeof window.default === 'function') {
        ComponentToRender = window.default;
      } else if (componentNames.length > 0) {
        ComponentToRender = window[componentNames[componentNames.length - 1]];
      }
      
      if (ComponentToRender) {
        ReactDOM.render(React.createElement(ComponentToRender), document.getElementById('root'));
      } else {
        document.getElementById('root').innerHTML = '<div class="error">No valid React component found. Make sure to export a component as default.</div>';
      }
      
    } catch (error) {
      console.error('Preview error:', error);
      document.getElementById('root').innerHTML = '<div class="error">Error rendering component:\\n' + error.message + '</div>';
      
      // Send error to parent if possible
      try {
        window.parent.postMessage({ type: 'preview-error', error: error.message }, '*');
      } catch (e) {
        // Ignore postMessage errors in sandboxed environment
      }
    }
  </script>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: "text/html" })
    const blobUrl = URL.createObjectURL(blob)

    iframe.src = blobUrl
    setError(null)

    return () => {
      URL.revokeObjectURL(blobUrl)
    }
  }, [code])

  // Listen for errors from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "preview-error") {
        setError(event.data.error)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  return (
    <Card className="h-full overflow-hidden rounded-xl border-border/50 shadow-sm flex flex-col">
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20 flex-shrink-0">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      )}
      <iframe 
        ref={iframeRef} 
        className="w-full flex-1 border-0 min-h-0" 
        sandbox="allow-scripts allow-same-origin" 
        title="Component Preview"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          minHeight: '500px',
          height: '100%'
        }}
      />
    </Card>
  )
}
