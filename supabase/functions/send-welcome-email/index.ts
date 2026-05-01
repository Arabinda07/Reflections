import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { render } from "https://esm.sh/@react-email/render@0.0.10"
import React from "https://esm.sh/react@18.2.0"
import { WelcomeEmail } from "../../../emails/templates/WelcomeEmail.tsx"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET') // Optional: A custom secret to verify the webhook origin

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // NOTE: If you use the Supabase Dashboard Webhooks UI, it handles 
  // authentication for you. You don't need to pass the Service Role Key.

  try {
    const payload = await req.json()
    
    // Supabase Webhooks send the record in a 'record' field
    const { record } = payload
    
    if (!record || !record.email) {
      console.error('No email found in record:', record)
      return new Response(JSON.stringify({ error: 'No email found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const email = record.email
    const fullName = record.full_name || 'there'
    const firstName = fullName.split(' ')[0]

    // Render the React Email template to HTML
    const emailHtml = render(
      React.createElement(WelcomeEmail, {
        userName: firstName,
        loginUrl: 'https://reflections.app/login',
        unsubscribeUrl: 'https://reflections.app/account',
        preferencesUrl: 'https://reflections.app/account'
      })
    )

    // Send the email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Reflections <welcome@reflections.app>', // Change this to your verified domain later
        to: [email],
        subject: `Welcome to Reflections, ${firstName}`,
        html: emailHtml,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error('Resend API error:', result)
      throw new Error('Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in send-welcome-email function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
