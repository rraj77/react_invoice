import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { authAPI, setAuthToken, setUserData, setCompanyData } from "@/lib/api";

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Invalid email address")
    .required("Email is required")
    .max(255, "Email must be less than 255 characters"),
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password must be less than 20 characters"),
  rememberMe: Yup.boolean()
});

const Login = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const response: any = await authAPI.login(values.email, values.password, values.rememberMe);
        
        // Store auth data
        setAuthToken(response.token);
        setUserData(response.user);
        setCompanyData(response.company);

        toast.success("Welcome back!");
        navigate("/dashboard");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Login failed. Please check your credentials.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-gradient-primary rounded-lg shadow-glow">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-base">
            Log in to your accoun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...formik.getFieldProps("password")}
                  placeholder="Enter your password"
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="text-sm text-destructive">{formik.errors.password}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formik.values.rememberMe}
                  onCheckedChange={(checked) => formik.setFieldValue("rememberMe", checked as boolean)}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Logging in..." : "Log In"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
