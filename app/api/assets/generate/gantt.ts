import ExcelJS from 'exceljs';
import { ProjectPlan } from '@/lib/types/survey';
import { supabase } from '@/lib/clients/supabaseClient';
import { Parser } from 'json2csv';

export async function generateGanttChart(projectPlan: ProjectPlan): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Project Gantt');

  // Set up columns based on the AI-generated project structure
  worksheet.columns = [
    { header: 'Task', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Dependencies', key: 'dependencies', width: 20 },
    { header: 'Cost', key: 'estimatedCost', width: 15 }
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2B579A' }
  };

  // Add tasks from AI-generated plan
  projectPlan.tasks.forEach(task => {
    worksheet.addRow({
      title: task.title,
      description: task.description,
      startDate: task.startDate,
      endDate: task.endDate,
      dependencies: task.dependencies.join(', '),
      estimatedCost: task.estimatedCost
    });
  });

  // Add milestones from AI-generated timeline
  projectPlan.timeline.milestones.forEach(milestone => {
    worksheet.addRow({
      title: `🏁 ${milestone.description}`,
      description: 'Milestone',
      startDate: milestone.date,
      endDate: milestone.date,
      dependencies: '',
      estimatedCost: 0
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Upload to Supabase Storage
  const fileName = `gantt-${Date.now()}.xlsx`;
  const { data, error } = await supabase.storage
    .from('charts')
    .upload(fileName, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('charts')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}

export async function generateGanttCSV(projectPlan: ProjectPlan): Promise<string> {
  // Prepare data for CSV
  const csvData = projectPlan.tasks.map(task => ({
    Title: task.title,
    Description: task.description,
    'Start Date': task.startDate,
    'End Date': task.endDate,
    Dependencies: task.dependencies.join(';'),
    'Estimated Cost': task.estimatedCost
  }));

  // Add milestones
  projectPlan.timeline.milestones.forEach(milestone => {
    csvData.push({
      Title: `🏁 ${milestone.description}`,
      Description: 'Milestone',
      'Start Date': milestone.date,
      'End Date': milestone.date,
      Dependencies: '',
      'Estimated Cost': 0
    });
  });

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(csvData);

  // Upload to Supabase Storage
  const fileName = `gantt-${Date.now()}.csv`;
  const { data, error } = await supabase.storage
    .from('charts')
    .upload(fileName, csv, {
      contentType: 'text/csv',
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from('charts')
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
} 