import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  suggestion: string;
}

interface AccessibilityReport {
  score: number;
  totalIssues: number;
  criticalIssues: number;
  issues: AccessibilityIssue[];
  lastScan: Date;
}

const AccessibilityCompliance: React.FC = () => {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);

  const mockReport: AccessibilityReport = {
    score: 85,
    totalIssues: 12,
    criticalIssues: 2,
    issues: [
      {
        id: '1',
        type: 'error',
        element: 'img[alt=""]',
        description: 'Image missing alternative text',
        impact: 'critical',
        wcagLevel: 'A',
        suggestion: 'Add descriptive alt text to all images'
      },
      {
        id: '2',
        type: 'warning',
        element: 'button',
        description: 'Button has insufficient color contrast',
        impact: 'serious',
        wcagLevel: 'AA',
        suggestion: 'Increase color contrast ratio to at least 4.5:1'
      },
      {
        id: '3',
        type: 'info',
        element: 'form',
        description: 'Form lacks proper labeling',
        impact: 'moderate',
        wcagLevel: 'A',
        suggestion: 'Associate labels with form controls using for/id attributes'
      }
    ],
    lastScan: new Date()
  };

  useEffect(() => {
    // Load initial report
    setReport(mockReport);
  }, []);

  const runAccessibilityScan = async () => {
    setIsScanning(true);
    
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setReport({
      ...mockReport,
      lastScan: new Date()
    });
    setIsScanning(false);
  };

  const getIssueIcon = (type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = (impact: AccessibilityIssue['impact']) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'serious':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'minor':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Compliance</h1>
          <p className="text-gray-600 mt-2">
            Monitor and improve your application's accessibility standards
          </p>
        </div>
        <Button 
          onClick={runAccessibilityScan}
          disabled={isScanning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning...' : 'Run Scan'}
        </Button>
      </div>

      {report && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Accessibility Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                  {report.score}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  WCAG 2.1 Compliance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalIssues}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Found in last scan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.criticalIssues}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {report.lastScan.toLocaleDateString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {report.lastScan.toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Issues</CardTitle>
              <CardDescription>
                Review and fix accessibility issues to improve compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{issue.description}</h3>
                            <Badge className={getImpactColor(issue.impact)}>
                              {issue.impact}
                            </Badge>
                            <Badge variant="outline">
                              WCAG {issue.wcagLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Element: <code className="bg-gray-100 px-1 rounded">{issue.element}</code>
                          </p>
                          <p className="text-sm text-gray-700">{issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* WCAG Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>WCAG 2.1 Guidelines</CardTitle>
              <CardDescription>
                Web Content Accessibility Guidelines compliance levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Level A</h3>
                  <p className="text-sm text-gray-600">
                    Minimum level of accessibility. Addresses major barriers.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Level AA</h3>
                  <p className="text-sm text-gray-600">
                    Standard level. Removes significant barriers to accessing content.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Level AAA</h3>
                  <p className="text-sm text-gray-600">
                    Enhanced level. Highest level of accessibility.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isScanning && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Running accessibility scan... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AccessibilityCompliance;