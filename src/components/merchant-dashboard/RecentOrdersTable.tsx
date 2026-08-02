import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/Table';
import { RecentOrderSummary } from '../../types/merchant-dashboard.types';

export interface RecentOrdersTableProps {
  orders: RecentOrderSummary[];
  isLoading?: boolean;
  onViewOrderDetails?: (orderId: string) => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders,
  isLoading,
  onViewOrderDetails,
}) => {
  return (
    <Card className="ag-recent-orders-card">
      <CardHeader style={{ paddingBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CardTitle style={{ fontSize: '1.25rem' }}>Recent Order Transactions</CardTitle>
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
          Showing latest {orders.length} orders
        </span>
      </CardHeader>

      <CardContent style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Loading recent orders feed...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead style={{ textAlign: 'right' }}>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.map((order) => {
                const isPOS = order.channel === 'POS';
                const isPaid = order.paymentStatus === 'PAID';
                const isDelivered = order.fulfillmentStatus === 'DELIVERED';

                return (
                  <TableRow key={order.id}>
                    <TableCell style={{ fontWeight: 600 }}>{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <span className={`ag-badge ${isPOS ? 'ag-badge-secondary' : 'ag-badge-primary'}`}>
                        {isPOS ? '🏪 POS Counter' : '🌐 Web Store'}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>৳{order.totalAmount.toLocaleString()} BDT</TableCell>
                    <TableCell>
                      <span className={`ag-badge ${isPaid ? 'ag-badge-success' : 'ag-badge-warning'}`}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`ag-badge ${isDelivered ? 'ag-badge-success' : 'ag-badge-info'}`}>
                        {order.fulfillmentStatus}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ag-btn ag-btn-xs ag-btn-outline"
                        onClick={() => onViewOrderDetails && onViewOrderDetails(order.id)}
                      >
                        View Details
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
