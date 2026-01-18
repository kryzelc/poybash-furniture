import { Order } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Image } from 'lucide-react';
import { getProducts } from '../lib/products';
import { QRCodeSVG } from 'qrcode.react';
import { domToPng } from 'modern-screenshot';
import { toast } from 'sonner';

interface InvoiceReceiptProps {
  order: Order;
}

export function InvoiceReceipt({ order }: InvoiceReceiptProps) {
  const handleSaveAsImage = async () => {
    const invoiceElement = document.getElementById('invoice-content');
    if (!invoiceElement) {
      toast.error('Invoice element not found');
      return;
    }

    let loadingToast: string | number | undefined;
    
    try {
      loadingToast = toast.loading('Capturing invoice...');

      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture with modern-screenshot
      const dataUrl = await domToPng(invoiceElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        quality: 1,
        fetch: {
          requestInit: {
            mode: 'cors',
          },
        },
      });

      if (loadingToast) toast.dismiss(loadingToast);

      // Convert data URL to blob and download
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Invoice saved successfully!');
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      console.error('Error saving invoice:', error);
      toast.error(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const products = getProducts();
  
  const getProductImage = (productId: number, fallbackUrl: string) => {
    const product = products.find(p => p.id === productId);
    return product?.imageUrl || fallbackUrl;
  };

  const getStatusBadgeStyle = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 px-3 py-1 rounded';
      case 'ready-for-pickup':
        return 'bg-blue-500/10 text-blue-700 px-3 py-1 rounded';
      case 'processing':
        return 'bg-yellow-500/10 text-yellow-700 px-3 py-1 rounded';
      case 'pending':
        return 'bg-orange-500/10 text-orange-700 px-3 py-1 rounded';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 px-3 py-1 rounded';
      case 'refunded':
        return 'bg-purple-500/10 text-purple-700 px-3 py-1 rounded';
      default:
        return 'bg-gray-500/10 text-gray-700 px-3 py-1 rounded';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 print:hidden">
        <Button onClick={handleSaveAsImage} variant="outline" className="flex-1">
          <Image className="h-4 w-4 mr-2" />
          Save as Image
        </Button>
      </div>

      <Card className="print-invoice print:shadow-none print:border-none">
        <CardContent className="p-4 sm:p-6" id="invoice-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-xl mb-4">INVOICE</h1>
              <div className="space-y-0.5 text-xs">
                <p>PoyBash Furniture</p>
                <p className="text-muted-foreground">1226 A. Lorenzo St.</p>
                <p className="text-muted-foreground">Tondo, Manila</p>
                <p className="text-muted-foreground">+63 932 549 0596</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Invoice #</p>
                <p className="text-sm font-mono">{order.id}</p>
              </div>
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Date</p>
                <p className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="mb-3 flex justify-end">
                <div className="inline-block p-1.5 bg-white rounded border border-gray-300">
                  <QRCodeSVG 
                    value={`POYBASH-ORDER-${order.id}`}
                    size={80}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Pickup Code</p>
              <p className="text-[10px] font-mono mb-2">{order.id}</p>
              <div className="flex justify-end">
                <span className={getStatusBadgeStyle(order.refundDetails ? 'refunded' : order.status) + ' text-[10px] px-2 py-0.5'}>
                  {order.refundDetails ? 'REFUNDED' : order.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To and Fulfillment */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs mb-1.5">Bill To:</p>
              <div className="space-y-0.5 text-xs">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p className="text-muted-foreground text-[11px]">{order.shippingAddress.address}</p>
                {order.shippingAddress.barangay && (
                  <p className="text-muted-foreground text-[11px]">Brgy. {order.shippingAddress.barangay}</p>
                )}
                <p className="text-muted-foreground text-[11px]">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-muted-foreground text-[11px]">{order.shippingAddress.country}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs mb-1.5">Fulfillment Method:</p>
              <div className="space-y-0.5 text-xs">
                <p>
                  {order.deliveryMethod === 'store-pickup' ? 'Store Pickup' : 'Customer Arranged Delivery'}
                </p>
                {order.pickupDetails && (
                  <>
                    <p className="text-muted-foreground text-[11px]">
                      Pickup Person: {order.pickupDetails.pickupPerson}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Contact: {order.pickupDetails.pickupPhone}
                    </p>
                    {order.pickupDetails.deliveryService && (
                      <p className="text-muted-foreground text-[11px]">
                        Service: {order.pickupDetails.deliveryService}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left pb-2 pr-2">Item</th>
                  <th className="text-left pb-2 px-2 w-24">Color/Size</th>
                  <th className="text-center pb-2 px-2 w-12">Qty</th>
                  <th className="text-right pb-2 px-2 w-24">Price</th>
                  <th className="text-right pb-2 pl-2 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <ImageWithFallback
                            src={getProductImage(item.productId, item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs leading-tight">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 align-top">
                      <div className="text-xs whitespace-nowrap">{item.color}</div>
                      {item.size && (
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">{item.size}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center align-top text-xs">{item.quantity}</td>
                    <td className="py-3 px-2 text-right align-top whitespace-nowrap text-xs">₱{item.price.toFixed(2)}</td>
                    <td className="py-3 pl-2 text-right align-top whitespace-nowrap text-xs font-medium">₱{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals - Right aligned to match header section */}
          <div className="mb-6 flex justify-end">
            <div className="w-full text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{order.subtotal.toFixed(2)}</span>
              </div>
              
              {order.couponCode && order.couponDiscount && order.couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">Discount ({order.couponCode}):</span>
                  <span className="text-green-600 dark:text-green-400">-₱{order.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {order.deliveryFee !== undefined && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₱{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              
              {order.reservationFee && order.reservationFee > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Reservation Fee Paid:</span>
                    <span>₱{order.reservationFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>({order.reservationPercentage}% of total)</span>
                    <span></span>
                  </div>
                </>
              )}
              
              <Separator className="my-1.5" />
              
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>₱{order.total.toFixed(2)}</span>
              </div>
              
              {order.reservationFee && order.reservationFee > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Balance Due:</span>
                  <span className="font-medium">₱{(order.total - order.reservationFee).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{order.paymentMethod.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Separator className="mb-4" />
          <div className="text-center text-xs space-y-1">
            <p>Thank you for your purchase!</p>
            <p className="text-muted-foreground text-[11px]">For questions about your order, visit us on Facebook: Poybash Furniture</p>
            <p className="text-muted-foreground text-[11px]">Call us at +63 932 549 0596</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}