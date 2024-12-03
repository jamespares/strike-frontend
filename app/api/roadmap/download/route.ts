import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import puppeteer from 'puppeteer-core'
import chrome from '@puppeteer/browsers'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the roadmap data
    const roadmap = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/roadmap/latest`).then(res => res.json())

    // Create HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 2rem;
            }
            .page-break {
              page-break-after: always;
            }
            .metric-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 1rem;
              margin: 1rem 0;
            }
            .timeline {
              position: relative;
              padding-left: 2rem;
            }
            .timeline::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 2px;
              background: #10B981;
              opacity: 0.3;
            }
            .timeline-dot {
              position: absolute;
              left: -0.5rem;
              width: 1rem;
              height: 1rem;
              border-radius: 50%;
              background: #10B981;
              opacity: 0.8;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">Project Roadmap</h1>
            <div class="timeline">
              ${roadmap.sections.map((section: any, index: number) => `
                <div class="mb-12 relative">
                  <div class="timeline-dot"></div>
                  <h2 class="text-2xl font-semibold text-gray-900 mb-4">
                    ${section.title}
                  </h2>
                  
                  ${section.metrics ? `
                    <div class="metric-grid">
                      ${section.metrics.map((metric: any) => `
                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <dt class="text-sm font-medium text-gray-500">${metric.label}</dt>
                          <dd class="mt-1 text-2xl font-semibold text-gray-900">
                            ${metric.value}${metric.unit ? `<span class="text-sm text-gray-500 ml-1">${metric.unit}</span>` : ''}
                          </dd>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}

                  ${Array.isArray(section.content) ? `
                    <ul class="space-y-2 text-gray-600 mt-4">
                      ${section.content.map((item: string) => `
                        <li class="flex items-start">
                          <span class="text-emerald-500 mr-2">•</span>
                          <span>${item}</span>
                        </li>
                      `).join('')}
                    </ul>
                  ` : `
                    <p class="text-gray-600 whitespace-pre-wrap mt-4">${section.content}</p>
                  `}
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `

    // Launch browser
    const browser = await puppeteer.launch({
      executablePath: await chrome.install(),
      args: ['--no-sandbox']
    })
    const page = await browser.newPage()

    // Set content and wait for rendering
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.evaluateHandle('document.fonts.ready')

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '40px', right: '40px', bottom: '40px', left: '40px' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: right; width: 100%; padding: 10px 40px;">
          <span style="color: #666;">Generated on ${new Date().toLocaleDateString()}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px;">
          <span style="color: #666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    })

    await browser.close()

    // Return PDF
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="roadmap.pdf"'
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    )
  }
} 