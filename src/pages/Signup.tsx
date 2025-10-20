import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Upload } from "lucide-react";
import { authAPI, setAuthToken, setUserData, setCompanyData } from "@/lib/api";

const signupSchema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .required("First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: Yup.string()
    .trim()
    .max(50, "Last name must be less than 50 characters"),
  email: Yup.string()
    .trim()
    .email("Invalid email address")
    .required("Email is required")
    .max(255, "Email must be less than 255 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be less than 20 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, "Password must contain letters and numbers"),
  companyName: Yup.string()
    .trim()
    .required("Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  address: Yup.string()
    .trim()
    .max(200, "Address must be less than 200 characters"),
  city: Yup.string()
    .trim()
    .max(50, "City must be less than 50 characters"),
  zip: Yup.string()
    .trim()
    .matches(/^[0-9]{6}$/, "ZIP code must be 6 digits"),
  industry: Yup.string()
    .trim()
    .max(50, "Industry must be less than 50 characters"),
  currencySymbol: Yup.string()
    .trim()
    .required("Currency symbol is required")
    .max(5, "Currency symbol must be less than 5 characters"),
});

const Signup = () => {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyName: "",
      address: "",
      city: "",
      zip: "",
      industry: "",
      currencySymbol: "₹",
    },
    validationSchema: signupSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('FirstName', values.firstName);
        formDataToSend.append('LastName', values.lastName);
        formDataToSend.append('Email', values.email);
        formDataToSend.append('Password', values.password);
        formDataToSend.append('CompanyName', values.companyName);
        formDataToSend.append('Address', values.address);
        formDataToSend.append('City', values.city);
        formDataToSend.append('ZipCode', values.zip);
        formDataToSend.append('Industry', values.industry);
        formDataToSend.append('CurrencySymbol', values.currencySymbol);
        
        if (logoFile) {
          formDataToSend.append('logo', logoFile);
        }

        const response: any = await authAPI.signup(formDataToSend);
        
        // Store auth data
        setAuthToken(response.token);
        setUserData(response.user);
        setCompanyData(response.company);

        toast.success("Account created successfully!");
        navigate("/dashboard");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Signup failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo size must be less than 5 MB");
        return;
      }
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        toast.error("Logo must be PNG or JPG");
        return;
      }
      setLogoFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-gradient-primary rounded-lg shadow-glow">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
          <CardDescription className="text-base">
            Set up your company and start invoicing in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...formik.getFieldProps("firstName")}
                    placeholder="Enter your first name"
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <p className="text-sm text-destructive">{formik.errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...formik.getFieldProps("lastName")}
                    placeholder="Enter your last name"
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <p className="text-sm text-destructive">{formik.errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...formik.getFieldProps("email")}
                  placeholder="your.email@example.com"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-sm text-destructive">{formik.errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  placeholder="Min 8 characters, letters and numbers"
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="text-sm text-destructive">{formik.errors.password}</p>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Company Information</h3>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...formik.getFieldProps("companyName")}
                  placeholder="Your company name"
                />
                {formik.touched.companyName && formik.errors.companyName && (
                  <p className="text-sm text-destructive">{formik.errors.companyName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...formik.getFieldProps("address")}
                  placeholder="Street address"
                />
                {formik.touched.address && formik.errors.address && (
                  <p className="text-sm text-destructive">{formik.errors.address}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...formik.getFieldProps("city")}
                    placeholder="City"
                  />
                  {formik.touched.city && formik.errors.city && (
                    <p className="text-sm text-destructive">{formik.errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    {...formik.getFieldProps("zip")}
                    placeholder="6 digits"
                  />
                  {formik.touched.zip && formik.errors.zip && (
                    <p className="text-sm text-destructive">{formik.errors.zip}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    {...formik.getFieldProps("industry")}
                    placeholder="e.g., IT Services"
                  />
                  {formik.touched.industry && formik.errors.industry && (
                    <p className="text-sm text-destructive">{formik.errors.industry}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol *</Label>
                  <Input
                    id="currencySymbol"
                    {...formik.getFieldProps("currencySymbol")}
                    placeholder="₹, $, €"
                  />
                  {formik.touched.currencySymbol && formik.errors.currencySymbol && (
                    <p className="text-sm text-destructive">{formik.errors.currencySymbol}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo (PNG/JPG, max 5MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                {logoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {logoFile.name}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Creating Account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
