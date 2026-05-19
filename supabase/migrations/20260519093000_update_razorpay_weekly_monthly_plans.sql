alter table if exists public.razorpay_subscriptions
  drop constraint if exists razorpay_subscriptions_plan_code_check;

alter table if exists public.razorpay_subscriptions
  add constraint razorpay_subscriptions_plan_code_check
  check (plan_code in ('weekly', 'monthly'));
