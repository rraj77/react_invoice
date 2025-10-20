import { useState, useEffect } from "react";
import { DollarSign, FileText, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { invoiceAPI, itemAPI } from "@/lib/api";
import { getCompanyData } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const company = getCompanyData();
  const currencySymbol = company?.currencySymbol || "₹";

  const [loading, setLoading] = useState(true);
  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load invoice summary
      const summary: any = await invoiceAPI.getSummary();
      setInvoiceSummary(summary);
      
      // Load 12-month trend
      const trend: any = await invoiceAPI.getTrend12m();
      setTrendData(Array.isArray(trend) ? trend.map((item: any) => ({
        month: new Date(item.monthStart).toLocaleDateString('en-US', { month: 'short' }),
        amount: item.amountSum,
        count: item.invoiceCount
      })) : []);
      
      // Load items count
      const items: any = await itemAPI.getList();
      setItemCount(Array.isArray(items) ? items.length : 0);
      
      // Load recent invoices
      const invoices: any = await invoiceAPI.getList();
      setRecentInvoices(Array.isArray(invoices) ? invoices.slice(0, 5) : []);
      
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const kpiData = [
    {
      title: "Total Revenue",
      value: loading ? "..." : `${currencySymbol}${invoiceSummary?.totalAmount?.toLocaleString() || 0}`,
      change: `${invoiceSummary?.invoiceCount || 0} invoices`,
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Total Invoices",
      value: loading ? "..." : (invoiceSummary?.invoiceCount || 0).toString(),
      change: "All time",
      icon: FileText,
      trend: "up",
    },
    {
      title: "Recent Invoices",
      value: loading ? "..." : recentInvoices.length.toString(),
      change: "Latest activity",
      icon: TrendingUp,
      trend: "neutral",
    },
    {
      title: "Total Items",
      value: loading ? "..." : itemCount.toString(),
      change: "In catalog",
      icon: ShoppingCart,
      trend: "up",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
          </div>
          <Button onClick={() => navigate("/invoices/new")} size="lg">
            Create Invoice
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="shadow-card hover:shadow-elegant transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs mt-1 ${kpi.trend === 'up' ? 'text-success' : 'text-muted-foreground'}`}>
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          ))}
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

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : recentInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No invoices yet</p>
              ) : (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.invoiceID} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">Invoice #{invoice.invoiceNo}</p>
                        <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{currencySymbol}{invoice.invoiceAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/invoices")}>
                View All Invoices
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => navigate("/invoices/new")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create New Invoice
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/items")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Manage Items
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/items/new")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
