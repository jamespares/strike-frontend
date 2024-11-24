// app/api/assets/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/clients/supabaseClient';
import { generateGanttChart, generateGanttCSV } from '@/lib/utils/createGanttChart';
import { generateBudgetTracker, generateBudgetCSV } from '@/lib/utils/createBudgetTracker';
import { generateRiskLog, generateRiskCSV } from '@/lib/utils/createRiskLog';
import { generateRoadmapDiagram } from '@/lib/utils/createRoadmapDiagram';
import { generateProjectAssets } from '@/lib/utils/generateProjectPlan';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Fetch survey responses
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (surveyError || !surveyData) {
      throw new Error('Survey responses not found');
    }

    // Generate assets
    const assets = await generateProjectAssets(userId, surveyData);

    return NextResponse.json(assets);
  } catch (error: any) {
    Sentry.captureException(error);
    console.error('Asset generation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

