import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { render } from "@react-email/render"
import React from "react"
import { WelcomeEmail } from "../../../emails/templates/WelcomeEmail.tsx"
import { NewsletterWelcomeEmail } from "../../../emails/templates/NewsletterWelcomeEmail.tsx"
import { createNewsletterToken } from "../_shared/newsletter-token.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FUNCTION_SECRET = Deno.env.get('FUNCTION_SECRET')
const NEWSLETTER_TOKEN_SECRET = Deno.env.get('NEWSLETTER_TOKEN_SECRET')
const REFLECTIONS_MAILING_ADDRESS = Deno.env.get('REFLECTIONS_MAILING_ADDRESS')
const REFLECTIONS_REPLY_TO_EMAIL = Deno.env.get('REFLECTIONS_REPLY_TO_EMAIL') || 'robinsaha434@gmail.com'
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') || 'https://www.reflections-sanctuary.space'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const encoder = new TextEncoder()
const RETRY_DELAYS_MS = [500, 1000, 2000]

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

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const isConcurrentIdempotencyError = (result: unknown) =>
  JSON.stringify(result).includes('concurrent_idempotent_requests')

const isRetryableResendFailure = (status: number, result: unknown) =>
  status === 408 ||
  status === 429 ||
  status >= 500 ||
  (status === 409 && isConcurrentIdempotencyError(result))

const createWelcomeText = ({
  firstName,
  loginUrl,
  newsletterOptIn,
  preferencesUrl,
  unsubscribeUrl,
  mailingAddress,
  replyToEmail,
}: {
  firstName: string
  loginUrl: string
  newsletterOptIn: boolean
  preferencesUrl: string
  unsubscribeUrl: string
  mailingAddress: string
  replyToEmail: string
}) => {
  const lines = [
    `Welcome to Reflections, ${firstName}.`,
    `Sign in: ${loginUrl}`,
  ]

  if (newsletterOptIn) {
    lines.push(
      `Manage email preferences: ${preferencesUrl}`,
      `Unsubscribe: ${unsubscribeUrl}`,
      `Mailing address: ${mailingAddress}`,
    )
  } else {
    lines.push(`Need help? Reply to this email or contact ${replyToEmail}.`)
  }

  return lines.join('\n\n')
}

const parseJsonResponse = async (res: Response) => {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const sendResendEmailWithRetry = async (body: Record<string, unknown>, idempotencyKey: string) => {
  let lastResult: unknown = null

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      })

      const result = await parseJsonResponse(res)

      if (res.ok) {
        return result
      }

      lastResult = result

      if (!isRetryableResendFailure(res.status, result) || attempt === RETRY_DELAYS_MS.length) {
        console.error('Resend API error status:', res.status)
        throw new Error('Failed to send email')
      }
    } catch (error) {
      if (attempt === RETRY_DELAYS_MS.length) {
        throw error
      }
    }

    await delay(RETRY_DELAYS_MS[attempt])
  }

  console.error('Resend API retry exhausted')
  throw new Error(lastResult ? 'Failed to send email' : 'Email provider request failed')
}

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

    if (!record.id) {
      return new Response(JSON.stringify({ error: 'No user id found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const email = record.email
    const fullName = record.raw_user_meta_data?.full_name || 'there'
    const firstName = fullName.split(' ')[0]
    const newsletterOptIn = record.raw_user_meta_data?.newsletter_opt_in === true || record.raw_user_meta_data?.newsletter_opt_in === 'true'
    const replyToEmail = REFLECTIONS_REPLY_TO_EMAIL

    if (newsletterOptIn && !NEWSLETTER_TOKEN_SECRET) {
      return new Response(JSON.stringify({ error: 'Newsletter token secret is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (newsletterOptIn && !REFLECTIONS_MAILING_ADDRESS) {
      return new Response(JSON.stringify({ error: 'Newsletter mailing address is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (newsletterOptIn && !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'Supabase URL is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const newsletterTokenSecret = NEWSLETTER_TOKEN_SECRET || ''
    const mailingAddress = REFLECTIONS_MAILING_ADDRESS || ''
    const preferencesUrl = `${PUBLIC_SITE_URL}/account`
    const loginUrl = `${PUBLIC_SITE_URL}/login`
    const unsubscribeUrl = newsletterOptIn
      ? `${SUPABASE_URL}/functions/v1/newsletter-preferences?token=${encodeURIComponent(await createNewsletterToken(record.id, newsletterTokenSecret))}`
      : ''
    const emailElement = newsletterOptIn
      ? React.createElement(NewsletterWelcomeEmail, {
          userName: firstName,
          loginUrl,
          unsubscribeUrl,
          preferencesUrl,
          mailingAddress,
        })
      : React.createElement(WelcomeEmail, {
          userName: firstName,
          loginUrl,
          supportEmail: replyToEmail,
        })
    const emailHtml = await render(emailElement)
    const emailText = createWelcomeText({
      firstName,
      loginUrl,
      newsletterOptIn,
      preferencesUrl,
      unsubscribeUrl,
      mailingAddress,
      replyToEmail,
    })

    const result = await sendResendEmailWithRetry({
      from: 'Reflections <welcome@reflections.app>',
      to: [email],
      subject: `Welcome to Reflections, ${firstName}`,
      html: emailHtml,
      text: emailText,
      reply_to: replyToEmail,
    }, `welcome-user/${record.id}`)

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
