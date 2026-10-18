-- set_review_display_name is used only by its existing BEFORE INSERT trigger.
-- PostgreSQL requires EXECUTE when creating the trigger; firing the trigger
-- does not expose this trigger-returning function as an application RPC.
-- Keep the trigger, its SECURITY DEFINER body, and RLS policy helpers intact.
begin;
revoke execute on function public.set_review_display_name() from authenticated;
commit;
