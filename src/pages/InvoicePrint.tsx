import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { invoiceAPI, getCompanyData } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { toast } from "sonner";

const InvoicePrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const company = getCompanyData();

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data: any = await invoiceAPI.getById(parseInt(id));
      setInvoice(data);
    } catch (error) {
      toast.error("Failed to load invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice content - optimized for printing */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="bg-card border rounded-lg p-12 print:border-0 print:rounded-none shadow-lg print:shadow-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">{company?.companyName}</h1>
              {company?.address && <p className="text-muted-foreground">{company.address}</p>}
              {company?.city && <p className="text-muted-foreground">{company.city}</p>}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">INVOICE</div>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Invoice No:</span> {invoice.invoiceNo}</p>
                <p><span className="font-semibold">Date:</span> {formatDate(invoice.invoiceDate)}</p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-12">
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h2>
            <div className="text-lg">
              <p className="font-semibold">{invoice.customerName}</p>
              {invoice.address && <p>{invoice.address}</p>}
              {invoice.city && <p>{invoice.city}</p>}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 font-semibold">Item</th>
                <th className="text-left py-3 font-semibold">Description</th>
                <th className="text-right py-3 font-semibold">Qty</th>
                <th className="text-right py-3 font-semibold">Rate</th>
                <th className="text-right py-3 font-semibold">Discount</th>
                <th className="text-right py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines?.map((line, index) => {
                const lineAmount = line.quantity * line.rate * (1 - line.discountPct / 100);
                return (
                  <tr key={index} className="border-b">
                    <td className="py-3">Item {line.itemID}</td>
                    <td className="py-3 text-muted-foreground text-sm">{line.description}</td>
                    <td className="py-3 text-right">{line.quantity}</td>
                    <td className="py-3 text-right">{company?.currencySymbol}{line.rate.toFixed(2)}</td>
                    <td className="py-3 text-right">{line.discountPct}%</td>
                    <td className="py-3 text-right font-medium">{company?.currencySymbol}{lineAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{company?.currencySymbol}{invoice.subTotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Tax ({invoice.taxPercentage}%):</span>
                <span className="font-medium">{company?.currencySymbol}{invoice.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-primary text-xl font-bold">
                <span>Total:</span>
                <span>{company?.currencySymbol}{invoice.invoiceAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">NOTES</h3>
              <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
