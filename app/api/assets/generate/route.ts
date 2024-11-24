// app/api/assets/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/clients/supabaseClient';
import { generateGanttChart, generateGanttCSV } from './gantt';
import { generateBudgetTracker, generateBudgetCSV } from './budget';
import { generateRiskLog, generateRiskCSV } from './risk';
import { generateRoadmap } from './roadmap';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Fetch project plan
    const { data: projectPlan, error: planError } = await supabase
      .from('project_plans')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (planError) throw planError;

    // Generate all assets and CSVs in parallel
    const [
      ganttChart, ganttCSV,
      budgetTracker, budgetCSV,
      riskLog, riskCSV,
      roadmap
    ] = await Promise.all([
      generateGanttChart(projectPlan.plan),
      generateGanttCSV(projectPlan.plan),
      generateBudgetTracker(projectPlan.plan),
      generateBudgetCSV(projectPlan.plan),
      generateRiskLog(projectPlan.plan),
      generateRiskCSV(projectPlan.plan),
      generateRoadmap(projectPlan.plan)
    ]);

    // Store URLs in Supabase
    const { error: assetError } = await supabase
      .from('user_assets')
      .upsert({
        user_id: userId,
        gantt_chart_url: ganttChart,
        gantt_csv_url: ganttCSV,
        budget_tracker_url: budgetTracker,
        budget_csv_url: budgetCSV,
        risk_log_url: riskLog,
        risk_csv_url: riskCSV,
        roadmap_url: roadmap
      }, { onConflict: 'user_id' });

    if (assetError) throw assetError;

    return NextResponse.json({
      ganttChart,
      ganttCSV,
      budgetTracker,
      budgetCSV,
      riskLog,
      riskCSV,
      roadmap
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Asset generation functions here...
