import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { invoiceAPI, itemAPI } from '@/lib/api';
import { getCompanyData } from '@/lib/api';
import type { Item, InvoiceLine } from '@/lib/types';

const invoiceLineSchema = Yup.object().shape({
  rowNo: Yup.number().required(),
  itemID: Yup.number()
    .min(1, 'Please select an item')
    .required('Item is required'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be less than 500 characters'),
  quantity: Yup.number()
    .min(1, 'Quantity must be at least 1')
    .required('Quantity is required'),
  rate: Yup.number()
    .min(0, 'Rate must be 0 or greater')
    .required('Rate is required'),
  discountPct: Yup.number()
    .min(0, 'Discount must be 0 or greater')
    .max(100, 'Discount must be 100 or less'),
});

const invoiceSchema = Yup.object().shape({
  invoiceNo: Yup.string()
    .trim()
    .matches(/^[0-9]+$/, 'Invoice number must contain only numbers')
    .required('Invoice number is required')
    .max(50, 'Invoice number must be less than 50 characters'),
  invoiceDate: Yup.date().required('Invoice date is required'),
  customerName: Yup.string()
    .trim()
    .required('Customer name is required')
    .max(100, 'Customer name must be less than 100 characters'),
  address: Yup.string()
    .trim()
    .max(200, 'Address must be less than 200 characters'),
  city: Yup.string().trim().max(50, 'City must be less than 50 characters'),
  taxPercentage: Yup.number()
    .min(0, 'Tax must be 0 or greater')
    .max(100, 'Tax must be 100 or less'),
  notes: Yup.string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters'),
  lines: Yup.array()
    .of(invoiceLineSchema)
    .min(1, 'At least one line item is required'),
});

const InvoiceEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const company = getCompanyData();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  const formik = useFormik({
    initialValues: {
      invoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      customerName: '',
      address: '',
      city: '',
      taxPercentage: 0,
      notes: '',
      lines: [
        {
          rowNo: 1,
          itemID: 0,
          description: '',
          quantity: 1,
          rate: 0,
          discountPct: 0,
        },
      ] as InvoiceLine[],
    },
    validationSchema: invoiceSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          invoiceNo: parseInt(values.invoiceNo) || 0,
          invoiceDate: new Date(values.invoiceDate).toISOString(),
          customerName: values.customerName,
          address: values.address || null,
          city: values.city || null,
          taxPercentage: values.taxPercentage,
          notes: values.notes || null,
          lines: values.lines.map((l, idx) => ({
            rowNo: idx + 1,
            itemID: l.itemID,
            description: l.description,
            quantity: l.quantity,
            rate: l.rate,
            discountPct: l.discountPct,
          })),
        };

        if (isEditMode) {
          const data: any = await invoiceAPI.getById(parseInt(id!));
          await invoiceAPI.update({
            ...payload,
            invoiceID: parseInt(id!),
            updatedOn: data.updatedOn,
          });
          toast.success('Invoice updated successfully');
        } else {
          await invoiceAPI.create(payload);
          toast.success('Invoice created successfully');
        }

        navigate('/invoices');
      } catch (error: any) {
        toast.error(error.message || 'Failed to save invoice');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    loadItems();
    if (isEditMode) {
      loadInvoice();
    }
  }, [id]);

  const loadItems = async () => {
    try {
      const data: any = await itemAPI.getLookupList();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load items');
    }
  };

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data: any = await invoiceAPI.getById(parseInt(id));
      formik.setValues({
        invoiceNo: data.invoiceNo.toString(),
        invoiceDate: data.invoiceDate.split('T')[0],
        customerName: data.customerName,
        address: data.address || '',
        city: data.city || '',
        taxPercentage: data.taxPercentage,
        notes: data.notes || '',
        lines:
          data.lines && data.lines.length > 0
            ? data.lines
            : [
                {
                  rowNo: 1,
                  itemID: 0,
                  description: '',
                  quantity: 1,
                  rate: 0,
                  discountPct: 0,
                },
              ],
      });
    } catch (error) {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const calculateLineAmount = (line: InvoiceLine) => {
    const subtotal = line.quantity * (line.rate || 0);
    const discount = subtotal * ((line.discountPct || 0) / 100);
    return subtotal - discount;
  };

  const handleLineChange = (
    index: number,
    field: keyof InvoiceLine,
    value: any
  ) => {
    const newLines = [...formik.values.lines];
    newLines[index] = { ...newLines[index], [field]: value };

    // If item selected, populate item details
    if (field === 'itemID' && value) {
      const item = items.find((i) => i.itemID === parseInt(value));
      if (item) {
        newLines[index].description = item.description || '';
        newLines[index].rate = item.salesRate;
        newLines[index].discountPct = item.discountPct;
      }
    }

    formik.setFieldValue('lines', newLines);
  };

  const addLine = () => {
    const lines = formik.values.lines;
    const newRowNo =
      lines.length > 0 ? Math.max(...lines.map((l) => l.rowNo)) + 1 : 1;
    formik.setFieldValue('lines', [
      ...lines,
      {
        rowNo: newRowNo,
        itemID: 0,
        description: '',
        quantity: 1,
        rate: 0,
        discountPct: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (formik.values.lines.length === 1) {
      toast.error('Invoice must have at least one line item');
      return;
    }
    formik.setFieldValue(
      'lines',
      formik.values.lines.filter((_, i) => i !== index)
    );
  };

  const subTotal = formik.values.lines.reduce(
    (sum, line) => sum + calculateLineAmount(line),
    0
  );
  const taxAmount = subTotal * (formik.values.taxPercentage / 100);
  const total = subTotal + taxAmount;

  if (loading && isEditMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate('/invoices')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {isEditMode ? 'Edit Invoice' : 'New Invoice'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditMode
                    ? 'Update invoice details'
                    : 'Create a new invoice for your customer'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/invoices')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Invoice'}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNo">Invoice Number *</Label>
                  <Input
                    id="invoiceNo"
                    {...formik.getFieldProps('invoiceNo')}
                    placeholder="INV-2025-001"
                  />
                  {formik.touched.invoiceNo && formik.errors.invoiceNo && (
                    <p className="text-sm text-destructive">
                      {formik.errors.invoiceNo}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    {...formik.getFieldProps('invoiceDate')}
                  />
                  {formik.touched.invoiceDate && formik.errors.invoiceDate && (
                    <p className="text-sm text-destructive">
                      {formik.errors.invoiceDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">Tax Percentage (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    step="0.01"
                    {...formik.getFieldProps('taxPercentage')}
                  />
                  {formik.touched.taxPercentage &&
                    formik.errors.taxPercentage && (
                      <p className="text-sm text-destructive">
                        {formik.errors.taxPercentage}
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    {...formik.getFieldProps('customerName')}
                    placeholder="Enter customer name"
                  />
                  {formik.touched.customerName &&
                    formik.errors.customerName && (
                      <p className="text-sm text-destructive">
                        {formik.errors.customerName}
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...formik.getFieldProps('address')}
                    placeholder="Street address"
                  />
                  {formik.touched.address && formik.errors.address && (
                    <p className="text-sm text-destructive">
                      {formik.errors.address}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...formik.getFieldProps('city')}
                    placeholder="City"
                  />
                  {formik.touched.city && formik.errors.city && (
                    <p className="text-sm text-destructive">
                      {formik.errors.city}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px] text-right">
                        Qty
                      </TableHead>
                      <TableHead className="w-[120px] text-right">
                        Rate
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Disc %
                      </TableHead>
                      <TableHead className="w-[120px] text-right">
                        Amount
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formik.values.lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.itemID?.toString()}
                            onValueChange={(value) =>
                              handleLineChange(index, 'itemID', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem
                                  key={item.itemID}
                                  value={item.itemID.toString()}
                                >
                                  {item.itemName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formik.touched.lines?.[index]?.itemID &&
                            formik.errors.lines?.[index] &&
                            typeof formik.errors.lines[index] === 'object' &&
                            (formik.errors.lines[index] as any).itemID && (
                              <p className="text-sm text-destructive mt-1">
                                {(formik.errors.lines[index] as any).itemID}
                              </p>
                            )}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Description"
                            className="min-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                'quantity',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.rate}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                'rate',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.discountPct}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                'discountPct',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {company?.currencySymbol}
                          {calculateLineAmount(line).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {company?.currencySymbol}
                      {subTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({formik.values.taxPercentage}%):
                    </span>
                    <span className="font-medium">
                      {company?.currencySymbol}
                      {taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>
                      {company?.currencySymbol}
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...formik.getFieldProps('notes')}
                placeholder="Add any additional notes or terms..."
                rows={4}
              />
              {formik.touched.notes && formik.errors.notes && (
                <p className="text-sm text-destructive mt-2">
                  {formik.errors.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </form>
      </FormikProvider>
    </DashboardLayout>
  );
};

export default InvoiceEditor;
