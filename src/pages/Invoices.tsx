import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  Edit,
  Printer,
  Trash2,
  Download,
  Settings2,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { invoiceAPI, getCompanyData } from '@/lib/api';
import { InvoiceListItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast as sonnerToast } from 'sonner';

const Invoices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const company = getCompanyData();
  const currencySymbol = company?.currencySymbol || '₹';

  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState({
    invoiceNo: true,
    customer: true,
    date: true,
    items: true,
    subtotal: true,
    taxPercentage: true,
    tax: true,
    total: true,
  });

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
    fetchTrend();
    fetchTopItems();
  }, [fromDate, toDate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = fromDate && toDate ? { fromDate, toDate } : undefined;
      const data = (await invoiceAPI.getList(params)) as InvoiceListItem[];
      setInvoices(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
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
      console.error('Failed to fetch summary:', error);
    }
  };

  const fetchTrend = async () => {
    try {
      const trend: any = await invoiceAPI.getTrend12m();
      setTrendData(
        Array.isArray(trend)
          ? trend.map((item: any) => ({
              month: new Date(item.monthStart).toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              }),
              amount: item.amountSum,
              count: item.invoiceCount,
            }))
          : []
      );
    } catch (error) {
      console.error('Failed to fetch trend:', error);
    }
  };

  const fetchTopItems = async () => {
    try {
      const data: any = await invoiceAPI.getTopItems(fromDate, toDate, 5);
      setTopItems(
        Array.isArray(data)
          ? data.map((item, index) => ({
              name: item.itemName || `Item ${index}`,
              value: Number(item.amount) || 0,
              color: `hsl(var(--chart-${(index % 5) + 1}))`,
            }))
          : []
      );
    } catch (error) {
      console.error('Failed to fetch top items:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await invoiceAPI.delete(deleteId);
      sonnerToast.success('Invoice deleted successfully');
      setDeleteId(null);
      fetchInvoices();
      fetchSummary();
    } catch (error) {
      sonnerToast.error('Failed to delete invoice');
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      String(invoice.invoiceNo)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const setQuickFilter = (filter: string) => {
    setActiveFilter(filter); // <-- track selected
    const today = new Date();
    let from = '';
    let to = today.toISOString().split('T')[0];

    switch (filter) {
      case 'today':
        from = to;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        from = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        from = yearAgo.toISOString().split('T')[0];
        break;
    }

    setFromDate(from);
    setToDate(to);
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setActiveFilter('');
  };

  const handleExport = () => {
    const headers = [
      'Invoice #',
      'Customer',
      'Date',
      'Items',
      'Subtotal',
      'Tax %',
      'Tax Amount',
      'Total',
    ];
    const rows = filteredInvoices.map((invoice) => [
      invoice.invoiceNo.toString(),
      invoice.customerName,
      formatDate(invoice.invoiceDate),
      '-', // Items count - will be populated when API provides this
      invoice.subTotal.toString(),
      (invoice.taxPercentage?.toFixed(2) || '0.00') + '%',
      invoice.taxAmount.toString(),
      invoice.invoiceAmount.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    sonnerToast.success('Invoices exported successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setQuickFilter('today')}
              variant={activeFilter === 'today' ? 'default' : 'outline'}
              size="sm"
            >
              Today
            </Button>
            <Button
              onClick={() => setQuickFilter('week')}
              variant={activeFilter === 'week' ? 'default' : 'outline'}
              size="sm"
            >
              Week
            </Button>
            <Button
              onClick={() => setQuickFilter('month')}
              variant={activeFilter === 'month' ? 'default' : 'outline'}
              size="sm"
            >
              Month
            </Button>
            <Button
              onClick={() => setQuickFilter('year')}
              variant={activeFilter === 'year' ? 'default' : 'outline'}
              size="sm"
            >
              Year
            </Button>
            <Button
              onClick={handleClearFilters}
              variant={activeFilter === '' ? 'default' : 'outline'}
              size="sm"
            >
              Custom
            </Button>
          </div>
        </div>

        {/* Mini Dashboard - 4 Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Invoice Count */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {summary ? summary.invoiceCount || 0 : '...'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Number of Invoices
              </p>
              <p className="text-xs text-muted-foreground">
                {fromDate || toDate ? 'Custom Range' : 'All Time'}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Total Amount */}
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {summary
                  ? `${currencySymbol}${
                      summary.totalAmount?.toLocaleString() || 0
                    }`
                  : '...'}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total Invoice Amount
              </p>
              <p className="text-xs text-muted-foreground">
                {fromDate || toDate ? 'Custom Range' : 'All Time'}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: 12-Month Trend (Line Chart) */}
          <Card className="shadow-card col-span-1 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Last 12 Months
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trendData}>
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip
                      formatter={(value: any) =>
                        `${currencySymbol}${value.toLocaleString()}`
                      }
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                  No data
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Top 5 Items (Pie Chart) */}
          <Card className="shadow-card col-span-1 sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Items</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={topItems}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {topItems.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color ||
                            [
                              '#8884d8',
                              '#82ca9d',
                              '#ffc658',
                              '#ff8042',
                              '#8dd1e1',
                            ][index % 5]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) =>
                        `${currencySymbol}${Number(value).toLocaleString()}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
                  No data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Date Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium">Custom Range:</span>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Invoice No, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => navigate('/invoices/new')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.invoiceNo}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        invoiceNo: checked,
                      }))
                    }
                  >
                    Invoice #
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.customer}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        customer: checked,
                      }))
                    }
                  >
                    Customer
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.date}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, date: checked }))
                    }
                  >
                    Date
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.items}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, items: checked }))
                    }
                  >
                    Items
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.subtotal}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        subtotal: checked,
                      }))
                    }
                  >
                    Subtotal
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.taxPercentage}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({
                        ...prev,
                        taxPercentage: checked,
                      }))
                    }
                  >
                    Tax %
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.tax}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, tax: checked }))
                    }
                  >
                    Tax Amount
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.total}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, total: checked }))
                    }
                  >
                    Total
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.invoiceNo && <TableHead>Invoice #</TableHead>}
                  {visibleColumns.customer && <TableHead>Customer</TableHead>}
                  {visibleColumns.date && <TableHead>Date</TableHead>}
                  {visibleColumns.items && (
                    <TableHead className="text-right">Items</TableHead>
                  )}
                  {visibleColumns.subtotal && (
                    <TableHead className="text-right">Subtotal</TableHead>
                  )}
                  {visibleColumns.taxPercentage && (
                    <TableHead className="text-right">Tax %</TableHead>
                  )}
                  {visibleColumns.tax && (
                    <TableHead className="text-right">Tax Amount</TableHead>
                  )}
                  {visibleColumns.total && (
                    <TableHead className="text-right">Total</TableHead>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : paginatedInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No invoices found. Create your first invoice to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.invoiceID}
                      className="hover:bg-muted/50"
                    >
                      {visibleColumns.invoiceNo && (
                        <TableCell className="font-medium">
                          {invoice.invoiceNo}
                        </TableCell>
                      )}
                      {visibleColumns.customer && (
                        <TableCell>{invoice.customerName}</TableCell>
                      )}
                      {visibleColumns.date && (
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      )}
                      {visibleColumns.items && (
                        <TableCell className="text-right">-</TableCell>
                      )}
                      {visibleColumns.subtotal && (
                        <TableCell className="text-right">
                          {currencySymbol}
                          {invoice.subTotal.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleColumns.taxPercentage && (
                        <TableCell className="text-right">
                          {invoice.taxPercentage?.toFixed(2) || '0.00'}%
                        </TableCell>
                      )}
                      {visibleColumns.tax && (
                        <TableCell className="text-right">
                          {currencySymbol}
                          {invoice.taxAmount.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleColumns.total && (
                        <TableCell className="text-right font-medium">
                          {currencySymbol}
                          {invoice.invoiceAmount.toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/invoices/${invoice.invoiceID}`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/invoices/print/${invoice.invoiceID}`)
                            }
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

            {/* Pagination */}
            {filteredInvoices.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Rows per page:
                  </span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(parseInt(value));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {page * rowsPerPage + 1}-
                    {Math.min(
                      (page + 1) * rowsPerPage,
                      filteredInvoices.length
                    )}{' '}
                    of {filteredInvoices.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Invoices;
