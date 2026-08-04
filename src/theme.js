// Centralized theme class tokens so components stay consistent
// when the dark / light toggle is used.
export function themeClasses(theme) {
  const dark = theme === 'dark'
  return {
    appBg: dark ? 'bg-void-950' : 'bg-slate-100',
    appBgImage: dark ? 'bg-grid' : '',
    panel: dark
      ? 'bg-void-900/80 border-void-600'
      : 'bg-white/90 border-slate-300',
    panelSolid: dark ? 'bg-void-900 border-void-600' : 'bg-white border-slate-300',
    panelAlt: dark ? 'bg-void-800 border-void-600' : 'bg-slate-50 border-slate-300',
    text: dark ? 'text-slate-200' : 'text-slate-800',
    textMuted: dark ? 'text-slate-400' : 'text-slate-500',
    textFaint: dark ? 'text-slate-500' : 'text-slate-400',
    border: dark ? 'border-void-600' : 'border-slate-300',
    hoverPanel: dark ? 'hover:bg-void-700' : 'hover:bg-slate-100',
    input: dark
      ? 'bg-void-800 border-void-600 text-slate-200 placeholder-slate-500'
      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
  }
}
