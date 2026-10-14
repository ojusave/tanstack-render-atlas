import type { SVGProps } from "react";

// Small inline icons keep the demo dependency-light and make each control readable.
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: "arrow" | "box" | "check" | "chevron" | "copy" | "download" | "file" | "layers" | "plus" | "refresh" | "upload" | "database" }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };

  if (name === "arrow") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M5 12h13M13 6l6 6-6 6" /></svg>;
  if (name === "box") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" /><path {...common} d="m4 7.5 8 4 8-4M12 11.5V20" /></svg>;
  if (name === "check") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="m5 12 4 4L19 6" /></svg>;
  if (name === "chevron") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="m8 10 4 4 4-4" /></svg>;
  if (name === "copy") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><rect {...common} x="8" y="8" width="11" height="11" rx="1.5" /><path {...common} d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-8A1.5 1.5 0 0 0 5 6.5v8A1.5 1.5 0 0 0 6.5 16H8" /></svg>;
  if (name === "download") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M12 4v11M8 11l4 4 4-4M5 19h14" /></svg>;
  if (name === "file") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M7 4h7l4 4v12H7V4Z" /><path {...common} d="M14 4v5h4M9 13h6M9 16h4" /></svg>;
  if (name === "layers") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="m12 4 8 4-8 4-8-4 8-4Z" /><path {...common} d="m4 12 8 4 8-4M4 16l8 4 8-4" /></svg>;
  if (name === "plus") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M12 5v14M5 12h14" /></svg>;
  if (name === "refresh") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M20 11a8 8 0 0 0-14-4L4 9M4 5v4h4M4 13a8 8 0 0 0 14 4l2-2M20 19v-4h-4" /></svg>;
  if (name === "upload") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><path {...common} d="M12 16V5M8 9l4-4 4 4M5 19h14" /></svg>;
  if (name === "database") return <svg viewBox="0 0 24 24" aria-hidden="true" {...props}><ellipse {...common} cx="12" cy="6" rx="7" ry="3" /><path {...common} d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>;
  return null;
}
