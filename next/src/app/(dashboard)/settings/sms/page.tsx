'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  MessageSquare,
  Send,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SMSSettings {
  id?: number;
  provider: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
  baseUrl: string;
  isActive: boolean;
}

const defaultSettings: SMSSettings = {
  provider: 'twilio',
  apiKey: '',
  apiSecret: '',
  senderId: '',
  baseUrl: '',
  isActive: false,
};

const smsProviders = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'nexmo', label: 'Nexmo (Vonage)' },
  { value: 'msg91', label: 'MSG91' },
  { value: 'textlocal', label: 'Textlocal' },
  { value: 'clickatell', label: 'Clickatell' },
  { value: 'custom', label: 'Custom HTTP API' },
];

export default function SMSSettingsPage() {
  const [settings, setSettings] = useState<SMSSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test message from the school management system.');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/sms');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/sms', {
        method: settings.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('SMS settings saved successfully');
        fetchSettings();
      } else {
        toast.error('Failed to save SMS settings');
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error('Failed to save SMS settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast.error('Please enter a test phone number');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/settings/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage, settings }),
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success('Test SMS sent successfully');
      } else {
        toast.error(result.message || 'Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      setTestResult({ success: false, message: 'Failed to send test SMS' });
      toast.error('Failed to send test SMS');
    } finally {
      setTesting(false);
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
          <h1 className="text-3xl font-bold tracking-tight">SMS Configuration</h1>
          <p className="text-muted-foreground">Configure SMS gateway for sending messages</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* SMS Provider Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Provider Configuration
            </CardTitle>
            <CardDescription>Configure your SMS gateway settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable SMS</Label>
                <p className="text-sm text-muted-foreground">Turn on SMS functionality</p>
              </div>
              <Switch
                checked={settings.isActive}
                onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">SMS Provider</Label>
              <Select value={settings.provider} onValueChange={(v) => setSettings({ ...settings, provider: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {smsProviders.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Account SID</Label>
              <Input
                id="apiKey"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="Enter API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret / Auth Token</Label>
              <Input
                id="apiSecret"
                type="password"
                value={settings.apiSecret}
                onChange={(e) => setSettings({ ...settings, apiSecret: e.target.value })}
                placeholder="Enter API secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderId">Sender ID</Label>
              <Input
                id="senderId"
                value={settings.senderId}
                onChange={(e) => setSettings({ ...settings, senderId: e.target.value })}
                placeholder="SCHOOL"
              />
              <p className="text-xs text-muted-foreground">
                The name or number that appears as the sender
              </p>
            </div>
            {settings.provider === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/sms"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test SMS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test SMS
            </CardTitle>
            <CardDescription>Send a test SMS to verify your configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Test Phone Number</Label>
              <Input
                id="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {testMessage.length} characters
              </p>
            </div>
            <Button onClick={handleTestSMS} disabled={testing || !settings.isActive}>
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test SMS
            </Button>
            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Twilio</h4>
              <p className="text-sm text-muted-foreground">
                Get your Account SID and Auth Token from the Twilio Console. Use your Twilio phone number as the Sender ID.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Nexmo (Vonage)</h4>
              <p className="text-sm text-muted-foreground">
                Find your API Key and API Secret in the Vonage API Dashboard. You can use an alphanumeric sender ID.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">MSG91</h4>
              <p className="text-sm text-muted-foreground">
                Get your Auth Key from MSG91 dashboard. Register your Sender ID before using it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
