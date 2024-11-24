import { useState } from 'react';
import { DownloadButton } from './DownloadButton';
import { Download } from 'lucide-react';

interface ProjectDownloadsProps {
  ganttChartUrl: string;
  ganttCsvUrl: string;
  budgetTrackerUrl: string;
  budgetCsvUrl: string;
  riskLogUrl: string;
  riskCsvUrl: string;
}

export function ProjectDownloads({ 
  ganttChartUrl, 
  ganttCsvUrl,
  budgetTrackerUrl,
  budgetCsvUrl,
  riskLogUrl,
  riskCsvUrl 
}: ProjectDownloadsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (url: string, filename: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-500">Download Your Assets</h3>
      <div className="grid grid-cols-2 gap-4">
        <DownloadButton
          onClick={() => handleDownload(ganttChartUrl, 'gantt-chart.xlsx')}
          disabled={isLoading || !ganttChartUrl}
        >
          Download Timeline (Excel)
        </DownloadButton>
        <DownloadButton
          onClick={() => handleDownload(ganttCsvUrl, 'gantt-chart.csv')}
          disabled={isLoading || !ganttCsvUrl}
          variant="outline"
        >
          Download Timeline (CSV)
        </DownloadButton>
        <DownloadButton
          onClick={() => handleDownload(budgetTrackerUrl, 'budget.xlsx')}
          disabled={isLoading || !budgetTrackerUrl}
        >
          Download Budget (Excel)
        </DownloadButton>
        <DownloadButton
          onClick={() => handleDownload(budgetCsvUrl, 'budget.csv')}
          disabled={isLoading || !budgetCsvUrl}
          variant="outline"
        >
          Download Budget (CSV)
        </DownloadButton>
        <DownloadButton
          onClick={() => handleDownload(riskLogUrl, 'risks.xlsx')}
          disabled={isLoading || !riskLogUrl}
        >
          Download Risks (Excel)
        </DownloadButton>
        <DownloadButton
          onClick={() => handleDownload(riskCsvUrl, 'risks.csv')}
          disabled={isLoading || !riskCsvUrl}
          variant="outline"
        >
          Download Risks (CSV)
        </DownloadButton>
      </div>
    </div>
  );
}