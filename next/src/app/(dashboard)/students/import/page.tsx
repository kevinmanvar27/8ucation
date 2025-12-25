'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImportStudentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Successfully imported ${data.imported} students`);
        router.push('/students');
      } else {
        toast.error(data.error || 'Failed to import students');
      }
    } catch (error) {
      toast.error('Failed to import students');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/students/import/template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Students</h1>
        <p className="text-muted-foreground">
          Import students from Excel/CSV file
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Excel/CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Upload a spreadsheet with student information
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              loading={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload and Import'}
            </Button>
          </CardContent>
        </Card>

        {/* Template Section */}
        <Card>
          <CardHeader>
            <CardTitle>Download Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download our Excel template to ensure your data is formatted correctly
            </p>
            
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            
            <div className="rounded-md border p-4">
              <h4 className="font-medium">Template Requirements</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Include headers: First Name, Last Name, Email, Phone</li>
                <li>• Date format: YYYY-MM-DD</li>
                <li>• Save as .xlsx or .csv file</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>
            <FileSpreadsheet className="mr-2 inline h-5 w-5" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li>1. Download and fill out the template</li>
            <li>2. Ensure all required fields are filled</li>
            <li>3. Save the file in Excel (.xlsx) or CSV format</li>
            <li>4. Upload the file using the form above</li>
            <li>5. Review the import results</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}