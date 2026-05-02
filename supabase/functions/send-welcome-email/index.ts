import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { render } from "@react-email/render"
import React from "react"
import { WelcomeEmail } from "../../../emails/templates/WelcomeEmail.tsx"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')
const encoder = new TextEncoder()

const timingSafeEqual = (left: string, right: string) => {
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  const length = Math.max(leftBytes.length, rightBytes.length)
  let diff = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return diff === 0
}

const isAuthorized = (req: Request) =>
  Boolean(FUNCTION_SECRET && timingSafeEqual(req.headers.get('x-function-secret') || '', FUNCTION_SECRET))

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  if (!FUNCTION_SECRET) {
    return new Response(JSON.stringify({ error: 'Function secret is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Email provider is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()
    
    // Supabase Webhooks send the record in a 'record' field
    const { record } = payload
    
    if (!record || !record.email) {
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
    const message = error instanceof Error ? error.message : 'Email request failed'
    console.error('Error in send-welcome-email function:', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
