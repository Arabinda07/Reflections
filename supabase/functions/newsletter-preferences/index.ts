import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyNewsletterToken } from "../_shared/newsletter-token.ts";

const NEWSLETTER_TOKEN_SECRET = Deno.env.get('NEWSLETTER_TOKEN_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const htmlResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

const confirmationPage = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed from Reflections</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8f5ef; color: #25221d; font-family: ui-serif, Georgia, serif; }
      main { width: min(90vw, 520px); padding: 40px 24px; text-align: center; }
      p { color: #6c655b; font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.6; }
    </style>
  </head>
  <body>
    <main>
      <h1>You are unsubscribed.</h1>
      <p>You will no longer receive the weekly Reflections note. Your account emails will still arrive when needed.</p>
    </main>
  </body>
</html>`;

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!NEWSLETTER_TOKEN_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return htmlResponse('Newsletter preferences are not configured.', 500);
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return htmlResponse('Missing unsubscribe token.', 400);
  }

  const userId = await verifyNewsletterToken(token, NEWSLETTER_TOKEN_SECRET);

  if (!userId) {
    return htmlResponse('Invalid unsubscribe token.', 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase
    .from('profiles')
    .update({
      newsletter_opt_in: false,
      newsletter_unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Newsletter unsubscribe update failed:', error.message);
    return htmlResponse('Could not update newsletter preferences.', 500);
  }

  return htmlResponse(confirmationPage);
});
