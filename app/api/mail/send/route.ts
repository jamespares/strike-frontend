import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: Request) {
  const { to, subject, text } = await request.json()

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      text,
    })
    return NextResponse.json({ message: 'Email sent successfully' })
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
