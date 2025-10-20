import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, FileText, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: "Easy Invoicing",
      description: "Create professional invoices in minutes with our intuitive interface",
    },
    {
      icon: BarChart3,
      title: "Insightful Dashboard",
      description: "Track revenue, pending invoices, and business metrics at a glance",
    },
    {
      icon: Building2,
      title: "Item Management",
      description: "Maintain a comprehensive catalog of your products and services",
    },
    {
      icon: Shield,
      title: "Secure & Branded",
      description: "Your company logo and branding on every invoice, with encrypted data",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-primary rounded-2xl shadow-glow">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Invoicing Made{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Simple & Professional
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The lightweight invoicing solution for small businesses and startups. 
            Create, manage, and track invoices with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-elegant"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-6 shadow-card hover:shadow-elegant transition-all"
            >
              <div className="p-3 bg-gradient-subtle rounded-lg w-fit mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center bg-gradient-subtle rounded-2xl p-12 max-w-4xl mx-auto shadow-elegant">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your invoicing?</h2>
          <p className="text-muted-foreground mb-6">
            Join businesses managing their invoices efficiently with InvoiceApp
          </p>
          <Button 
            size="lg" 
            className="px-8 py-6"
            onClick={() => navigate("/signup")}
          >
            Start Invoicing Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
