import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', icon, className = '', children, ...props }) => {
  const badgeClasses = ['ag-badge', `ag-badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className="ag-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
