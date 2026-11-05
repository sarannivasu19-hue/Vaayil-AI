import React from 'react';
import {
  HeartPulse,
  Stethoscope,
  PawPrint,
  Hotel,
  UtensilsCrossed,
  GraduationCap,
  Building2,
  Sparkles,
  PhoneCall,
  Activity,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  HeartPulse,
  Stethoscope,
  PawPrint,
  Hotel,
  UtensilsCrossed,
  GraduationCap,
  Building2,
  Sparkles,
  PhoneCall,
  Activity,
  Calendar,
  AlertTriangle,
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name] || Building2;
  return <IconComponent {...props} />;
};
