import type { ReactNode } from "react";

// Iconos de línea (trazo 2 px, extremos redondeados) en currentColor, estilo Lucide
function Icon({ children, className = "size-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export const IconArrow = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
export const IconCalc = ({ className }: { className?: string }) => (
  <Icon className={className}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h8" /></Icon>
);
export const IconLink = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></Icon>
);
export const IconCalendar = ({ className }: { className?: string }) => (
  <Icon className={className}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
);
export const IconCamera = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3.5" /></Icon>
);
export const IconWifiOff = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.9a10 10 0 0 1 5.2-2.7M15 10.4a10 10 0 0 1 4 2.5" /><path d="M12 20h.01" /></Icon>
);
export const IconTable = ({ className }: { className?: string }) => (
  <Icon className={className}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></Icon>
);
export const IconShield = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></Icon>
);
export const IconEyeOff = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M2 2l20 20M6.7 6.7C3.9 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.5 4.9-1.3M9.9 4.2A9 9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2" /><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" /></Icon>
);
export const IconLock = ({ className }: { className?: string }) => (
  <Icon className={className}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
);
export const IconCheck = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M20 6L9 17l-5-5" /></Icon>
);
export const IconClock = ({ className }: { className?: string }) => (
  <Icon className={className}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>
);
export const IconChat = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z" /></Icon>
);
export const IconTruck = ({ className }: { className?: string }) => (
  <Icon className={className}><path d="M1 3h13v13H1zM14 8h4l4 4v4h-8" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></Icon>
);
