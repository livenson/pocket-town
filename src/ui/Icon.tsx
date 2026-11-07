import { ICON_STROKE, ICON_VIEWBOX, icons, type IconName } from '../design/icons';

interface IconProps {
  name: IconName;
  /** Rendered size in CSS px (the icon is square). */
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** One icon from the Pocket Town family. Decorative: the parent control carries the label. */
export function Icon({ name, size = 32, strokeWidth = ICON_STROKE, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={ICON_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={icons[name]} />
    </svg>
  );
}
