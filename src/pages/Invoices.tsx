import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Printer, Trash2, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { invoiceAPI, getCompanyData } from "@/lib/api";
import { InvoiceListItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast as sonnerToast } from "sonner";

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const company = getCompanyData();
  const currencySymbol = company?.currencySymbol || "₹";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchTrend();
  }, [fromDate, toDate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = fromDate && toDate ? { fromDate, toDate } : undefined;
      const data = await invoiceAPI.getList(params) as InvoiceListItem[];
      setInvoices(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = fromDate && toDate ? { fromDate, toDate } : undefined;
      const data: any = await invoiceAPI.getSummary(params);
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  const fetchTrend = async () => {
    try {
      const trend: any = await invoiceAPI.getTrend12m();
      setTrendData(Array.isArray(trend) ? trend.map((item: any) => ({
        month: new Date(item.monthStart).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: item.amountSum,
        count: item.invoiceCount
      })) : []);
    } catch (error) {
      console.error("Failed to fetch trend:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      await invoiceAPI.delete(deleteId);
      sonnerToast.success("Invoice deleted successfully");
      setDeleteId(null);
      fetchInvoices();
      fetchSummary();
    } catch (error) {
      sonnerToast.error("Failed to delete invoice");
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    String(invoice.invoiceNo).toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">View and manage all your invoices</p>
          </div>
          <Button onClick={() => navigate("/invoices/new")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Mini Dashboard - KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {summary ? `${currencySymbol}${summary.totalAmount?.toLocaleString() || 0}` : "..."}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Invoiced</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {summary ? summary.invoiceCount || 0 : "..."}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Invoices</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {summary && summary.invoiceCount > 0 
                  ? `${currencySymbol}${(summary.totalAmount / summary.invoiceCount).toFixed(2)}`
                  : `${currencySymbol}0`}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Average Invoice</p>
            </CardContent>
          </Card>
        </div>

        {/* 12-Month Trend Chart */}
        {trendData.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>12-Month Invoice Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${currencySymbol}${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" name="Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Date Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Date:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              {(fromDate || toDate) && (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.invoiceID} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{invoice.subTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{currencySymbol}{invoice.taxAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol}{invoice.invoiceAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/invoices/${invoice.invoiceID}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/invoices/print/${invoice.invoiceID}`)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(invoice.invoiceID)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Invoices;
