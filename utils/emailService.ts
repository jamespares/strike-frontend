export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const response = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to send email')
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
} 