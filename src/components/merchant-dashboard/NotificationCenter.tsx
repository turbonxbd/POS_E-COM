import React, { useState } from 'react';
import { DashboardNotification } from '../../types/merchant-dashboard.types';

export interface NotificationCenterProps {
  notifications: DashboardNotification[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="ag-notification-center" style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.125rem',
          cursor: 'pointer',
          color: 'var(--foreground)',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '50%',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.125rem 0.375rem',
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '3rem',
            right: 0,
            width: '22rem',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <strong style={{ fontSize: '0.9375rem' }}>Store Notifications</strong>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                Clear All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ margin: '1rem 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.8125rem' }}>
              No active notifications.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '18rem', overflowY: 'auto' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--border-radius)',
                    backgroundColor: notif.isRead ? 'transparent' : 'var(--muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {notif.title}
                    </span>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead && onMarkAsRead(notif.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.6875rem' }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
