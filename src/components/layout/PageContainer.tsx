import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  actions,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`ag-page-container ${className}`} {...props}>
      {(title || description || actions) && (
        <header className="ag-page-header">
          <div className="ag-page-title-group">
            {title && <h1 className="ag-page-title">{title}</h1>}
            {description && <p className="ag-page-description">{description}</p>}
          </div>
          {actions && <div className="ag-page-actions">{actions}</div>}
        </header>
      )}
      <main className="ag-page-content">{children}</main>
    </div>
  );
};
