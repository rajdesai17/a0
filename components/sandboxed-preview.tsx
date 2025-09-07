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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            destructive: {
              DEFAULT: "hsl(var(--destructive))",
              foreground: "hsl(var(--destructive-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            popover: {
              DEFAULT: "hsl(var(--popover))",
              foreground: "hsl(var(--popover-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        },
      },
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 222.2 84% 4.9%;
      --primary: 221.2 83.2% 53.3%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 221.2 83.2% 53.3%;
    }
    
    .dark {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --card: 222.2 84% 4.9%;
      --card-foreground: 210 40% 98%;
      --popover: 222.2 84% 4.9%;
      --popover-foreground: 210 40% 98%;
      --primary: 217.2 91.2% 59.8%;
      --primary-foreground: 222.2 84% 4.9%;
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      --muted: 217.2 32.6% 17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 224.3 76.3% 94.1%;
    }
    
    body {
      margin: 0;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
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
    <Card className="h-full overflow-hidden">
      {error && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      )}
      <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" title="Component Preview" />
    </Card>
  )
}
