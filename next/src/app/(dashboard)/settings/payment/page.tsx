'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save,
  Loader2,
  CreditCard,
  DollarSign,
  Shield,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSettings {
  id?: number;
  // Stripe
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  // PayPal
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalMode: string;
  // Razorpay
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  // General
  currency: string;
  testMode: boolean;
}

const defaultSettings: PaymentSettings = {
  stripeEnabled: false,
  stripePublicKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  paypalEnabled: false,
  paypalClientId: '',
  paypalClientSecret: '',
  paypalMode: 'sandbox',
  razorpayEnabled: false,
  razorpayKeyId: '',
  razorpayKeySecret: '',
  currency: 'USD',
  testMode: true,
};

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
];

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/payment');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/payment', {
        method: settings.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Payment settings saved successfully');
        fetchSettings();
      } else {
        toast.error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateway Settings</h1>
          <p className="text-muted-foreground">Configure online payment gateways for fee collection</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Test Mode</Label>
                <p className="text-sm text-muted-foreground">Use sandbox/test credentials</p>
              </div>
              <Switch
                checked={settings.testMode}
                onCheckedChange={(checked) => setSettings({ ...settings, testMode: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateways */}
      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
            {settings.stripeEnabled && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            PayPal
            {settings.paypalEnabled && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="razorpay" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Razorpay
            {settings.razorpayEnabled && <CheckCircle className="h-3 w-3 text-green-500" />}
          </TabsTrigger>
        </TabsList>

        {/* Stripe */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stripe Configuration</CardTitle>
                  <CardDescription>Accept payments via Stripe</CardDescription>
                </div>
                <Switch
                  checked={settings.stripeEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey">Publishable Key</Label>
                <Input
                  id="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                  placeholder="pk_test_..."
                  disabled={!settings.stripeEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Secret Key</Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                  placeholder="sk_test_..."
                  disabled={!settings.stripeEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
                <Input
                  id="stripeWebhookSecret"
                  type="password"
                  value={settings.stripeWebhookSecret}
                  onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })}
                  placeholder="whsec_..."
                  disabled={!settings.stripeEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Required for handling payment webhooks
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal */}
        <TabsContent value="paypal">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PayPal Configuration</CardTitle>
                  <CardDescription>Accept payments via PayPal</CardDescription>
                </div>
                <Switch
                  checked={settings.paypalEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, paypalEnabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paypalMode">Mode</Label>
                <Select 
                  value={settings.paypalMode} 
                  onValueChange={(v) => setSettings({ ...settings, paypalMode: v })}
                  disabled={!settings.paypalEnabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                    <SelectItem value="live">Live (Production)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalClientId">Client ID</Label>
                <Input
                  id="paypalClientId"
                  value={settings.paypalClientId}
                  onChange={(e) => setSettings({ ...settings, paypalClientId: e.target.value })}
                  placeholder="Enter PayPal Client ID"
                  disabled={!settings.paypalEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalClientSecret">Client Secret</Label>
                <Input
                  id="paypalClientSecret"
                  type="password"
                  value={settings.paypalClientSecret}
                  onChange={(e) => setSettings({ ...settings, paypalClientSecret: e.target.value })}
                  placeholder="Enter PayPal Client Secret"
                  disabled={!settings.paypalEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Razorpay */}
        <TabsContent value="razorpay">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Razorpay Configuration</CardTitle>
                  <CardDescription>Accept payments via Razorpay (India)</CardDescription>
                </div>
                <Switch
                  checked={settings.razorpayEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, razorpayEnabled: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razorpayKeyId">Key ID</Label>
                <Input
                  id="razorpayKeyId"
                  value={settings.razorpayKeyId}
                  onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                  placeholder="rzp_test_..."
                  disabled={!settings.razorpayEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razorpayKeySecret">Key Secret</Label>
                <Input
                  id="razorpayKeySecret"
                  type="password"
                  value={settings.razorpayKeySecret}
                  onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                  placeholder="Enter Razorpay Key Secret"
                  disabled={!settings.razorpayEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Security Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Never share your secret keys or expose them in client-side code. 
                All API keys are stored securely and encrypted. 
                Always use test/sandbox credentials during development.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
