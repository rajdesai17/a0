"use client"

import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Toggle } from "@/components/origin-ui/toggle"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Toggle
        variant="outline"
        className="group data-[state=on]:hover:bg-muted size-9 data-[state=on]:bg-transparent"
        pressed={false}
        disabled
        aria-label="Loading theme toggle"
      >
        <SunIcon
          size={16}
          className="shrink-0"
          aria-hidden="true"
        />
      </Toggle>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Toggle
      variant="outline"
      className="group data-[state=on]:hover:bg-muted size-9 data-[state=on]:bg-transparent"
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Icons with proper dark/light mode transitions */}
      <MoonIcon
        size={16}
        className="shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
        aria-hidden="true"
      />
      <SunIcon
        size={16}
        className="absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
        aria-hidden="true"
      />
    </Toggle>
  )
}
