-- StudentPro development seed data
-- Clearly labeled DEMO content — not real users or genuine reviews.

-- Universities
insert into public.universities (id, name, short_name) values
  ('11111111-1111-4111-8111-111111111101', 'University of Vienna', 'Uni Wien'),
  ('11111111-1111-4111-8111-111111111102', 'Vienna University of Economics and Business', 'WU'),
  ('11111111-1111-4111-8111-111111111103', 'TU Wien', 'TU Wien'),
  ('11111111-1111-4111-8111-111111111104', 'Modul University Vienna', 'Modul'),
  ('11111111-1111-4111-8111-111111111105', 'Medical University of Vienna', 'MedUni'),
  ('11111111-1111-4111-8111-111111111106', 'University of Applied Arts Vienna', 'Die Angewandte'),
  ('11111111-1111-4111-8111-111111111107', 'Academy of Fine Arts Vienna', 'Akademie'),
  ('11111111-1111-4111-8111-111111111108', 'FH Technikum Wien', 'Technikum'),
  ('11111111-1111-4111-8111-111111111109', 'FH Campus Wien', 'FH Campus'),
  ('11111111-1111-4111-8111-111111111110', 'Other accredited university', 'Other')
on conflict (name) do nothing;

-- Approved email domains (configurable allowlist — not every .ac.at)
insert into public.university_email_domains (university_id, domain) values
  ('11111111-1111-4111-8111-111111111101', 'univie.ac.at'),
  ('11111111-1111-4111-8111-111111111101', 'student.univie.ac.at'),
  ('11111111-1111-4111-8111-111111111102', 'wu.ac.at'),
  ('11111111-1111-4111-8111-111111111102', 's.wu.ac.at'),
  ('11111111-1111-4111-8111-111111111103', 'tuwien.ac.at'),
  ('11111111-1111-4111-8111-111111111103', 'student.tuwien.ac.at'),
  ('11111111-1111-4111-8111-111111111104', 'modul.ac.at'),
  ('11111111-1111-4111-8111-111111111105', 'meduniwien.ac.at'),
  ('11111111-1111-4111-8111-111111111106', 'uni-ak.ac.at'),
  ('11111111-1111-4111-8111-111111111107', 'akbild.ac.at'),
  ('11111111-1111-4111-8111-111111111108', 'technikum-wien.at'),
  ('11111111-1111-4111-8111-111111111109', 'fh-campuswien.ac.at')
on conflict do nothing;

-- Categories
insert into public.categories (id, name, slug, description, icon, sort_order) values
  ('22222222-2222-4222-8222-222222222201', 'Photography', 'photography', 'Photo shoots, events, portraits', 'camera', 1),
  ('22222222-2222-4222-8222-222222222202', 'Video Editing', 'video-editing', 'Editing, reels, short films', 'film', 2),
  ('22222222-2222-4222-8222-222222222203', 'Graphic Design', 'graphic-design', 'Posters, branding, social graphics', 'palette', 3),
  ('22222222-2222-4222-8222-222222222204', 'Tutoring', 'tutoring', 'Subject help and exam prep', 'book-open', 4),
  ('22222222-2222-4222-8222-222222222205', 'Technology', 'technology', 'Websites, apps, computer help', 'laptop', 5),
  ('22222222-2222-4222-8222-222222222206', 'Moving Help', 'moving-help', 'Furniture and apartment moves', 'truck', 6),
  ('22222222-2222-4222-8222-222222222207', 'Language Support', 'language-support', 'Practice and translation', 'languages', 7),
  ('22222222-2222-4222-8222-222222222208', 'Everyday Help', 'everyday-help', 'Errands and day-to-day assistance', 'hand-helping', 8)
on conflict (slug) do nothing;

-- Skills
insert into public.skills (id, category_id, name, slug) values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Portrait Photography', 'portrait-photography'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', 'Event Photography', 'event-photography'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222202', 'Premiere Pro', 'premiere-pro'),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222202', 'Short-form Video', 'short-form-video'),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222203', 'Figma', 'figma'),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222203', 'Illustrator', 'illustrator'),
  ('33333333-3333-4333-8333-333333333307', '22222222-2222-4222-8222-222222222204', 'Mathematics Tutoring', 'mathematics-tutoring'),
  ('33333333-3333-4333-8333-333333333308', '22222222-2222-4222-8222-222222222204', 'Economics Tutoring', 'economics-tutoring'),
  ('33333333-3333-4333-8333-333333333309', '22222222-2222-4222-8222-222222222205', 'Web Development', 'web-development'),
  ('33333333-3333-4333-8333-333333333310', '22222222-2222-4222-8222-222222222205', 'Computer Assistance', 'computer-assistance'),
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222206', 'Furniture Moving', 'furniture-moving'),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222207', 'German Practice', 'german-practice'),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222207', 'English Practice', 'english-practice'),
  ('33333333-3333-4333-8333-333333333314', '22222222-2222-4222-8222-222222222208', 'Errands', 'errands')
on conflict (slug) do nothing;

-- NOTE: Demo profiles, requests, and reviews should be created after auth users exist.
-- Prefer creating demo users via the Supabase Auth Admin API or dashboard, then
-- updating profiles. Do not treat any seed content as real marketplace activity.

comment on table public.universities is 'Seeded university list for Vienna-focused MVP demo';
comment on table public.categories is 'DEMO seed categories for StudentPro development';
