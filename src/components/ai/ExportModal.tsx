import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileJson, File } from 'lucide-react';
import { toast } from '@/lib/toast';

export interface ExportData {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  metrics: Record<string, any>;
  timestamp: Date;
  responseCount: number;
  formTitle?: string;
}

export interface ExportModalProps {
  data: ExportData;
  trigger?: React.ReactNode;
}

const ExportModal: React.FC<ExportModalProps> = ({ data, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportAsJSON = () => {
    setExporting(true);
    try {
      const exportData = {
        formTitle: data.formTitle || 'Survey',
        generatedAt: data.timestamp.toISOString(),
        responseCount: data.responseCount,
        summary: data.summary,
        keyInsights: data.keyInsights,
        recommendations: data.recommendations,
        metrics: data.metrics,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartformai-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported as JSON');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportAsTXT = () => {
    setExporting(true);
    try {
      let content = `SmartFormAI Analytics Report\n`;
      content += `Generated: ${data.timestamp.toLocaleString()}\n`;
      content += `Form: ${data.formTitle || 'Survey'}\n`;
      content += `Responses Analyzed: ${data.responseCount}\n\n`;
      content += `=== SUMMARY ===\n${data.summary}\n\n`;
      content += `=== KEY INSIGHTS ===\n`;
      data.keyInsights.forEach((insight, i) => {
        content += `${i + 1}. ${insight}\n`;
      });
      content += `\n=== RECOMMENDATIONS ===\n`;
      data.recommendations.forEach((rec, i) => {
        content += `${i + 1}. ${rec}\n`;
      });
      content += `\n=== METRICS ===\n`;
      Object.entries(data.metrics).forEach(([key, value]) => {
        content += `${key}: ${JSON.stringify(value, null, 2)}\n`;
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartformai-analytics-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported as TXT');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportAsPDF = async () => {
    setExporting(true);
    try {
      // For PDF, we'll use a simple approach with window.print or a library
      // For now, we'll create an HTML document and trigger print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        setExporting(false);
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SmartFormAI Analytics Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              h1 { color: #0066cc; }
              h2 { color: #424245; margin-top: 30px; }
              .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .insight, .recommendation { margin: 10px 0; padding: 10px; background: #f9f9f9; border-left: 3px solid #0066cc; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <h1>SmartFormAI Analytics Report</h1>
            <p><strong>Generated:</strong> ${data.timestamp.toLocaleString()}</p>
            <p><strong>Form:</strong> ${data.formTitle || 'Survey'}</p>
            <p><strong>Responses Analyzed:</strong> ${data.responseCount}</p>
            
            <h2>Summary</h2>
            <div class="summary">${data.summary}</div>
            
            <h2>Key Insights</h2>
            ${data.keyInsights.map((insight, i) => `<div class="insight">${i + 1}. ${insight}</div>`).join('')}
            
            <h2>Recommendations</h2>
            ${data.recommendations.map((rec, i) => `<div class="recommendation">${i + 1}. ${rec}</div>`).join('')}
            
            <h2>Metrics</h2>
            <pre>${JSON.stringify(data.metrics, null, 2)}</pre>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a bit for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
        toast.success('PDF export ready');
        setIsOpen(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-[#2E2E2E]">Export Analytics Report</DialogTitle>
          <DialogDescription className="text-gray-600">
            Choose a format to export your AI analytics report
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button
            onClick={exportAsTXT}
            disabled={exporting}
            className="w-full justify-start bg-white hover:bg-gray-50 text-[#2E2E2E] border border-gray-200"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as TXT
          </Button>
          <Button
            onClick={exportAsJSON}
            disabled={exporting}
            className="w-full justify-start bg-white hover:bg-gray-50 text-[#2E2E2E] border border-gray-200"
          >
            <FileJson className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          <Button
            onClick={exportAsPDF}
            disabled={exporting}
            className="w-full justify-start bg-white hover:bg-gray-50 text-[#2E2E2E] border border-gray-200"
          >
            <File className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;

