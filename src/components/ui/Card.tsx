import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = '', children, ...props }) => (
  <div className={`ag-card ${className}`} {...props}>
    {children}
  </div>
);

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children, ...props }) => (
  <div className={`ag-card-header ${className}`} {...props}>
    {children}
  </div>
);

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle: React.FC<CardTitleProps> = ({ className = '', children, ...props }) => (
  <h3 className={`ag-card-title ${className}`} {...props}>
    {children}
  </h3>
);

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export const CardDescription: React.FC<CardDescriptionProps> = ({ className = '', children, ...props }) => (
  <p className={`ag-card-description ${className}`} {...props}>
    {children}
  </p>
);

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardContent: React.FC<CardContentProps> = ({ className = '', children, ...props }) => (
  <div className={`ag-card-content ${className}`} {...props}>
    {children}
  </div>
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children, ...props }) => (
  <div className={`ag-card-footer ${className}`} {...props}>
    {children}
  </div>
);
