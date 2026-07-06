ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;